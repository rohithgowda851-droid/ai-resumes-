import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import multer from "multer";
import mammoth from "mammoth";
import { fileURLToPath } from "url";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

interface MulterRequest extends express.Request {
  file?: Express.Multer.File;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Configure Multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // API to extract text from resumes
  app.post("/api/extract-text", upload.single("resume"), async (req: express.Request, res: express.Response) => {
    console.log("POST /api/extract-text hit");
    try {
      const mReq = req as MulterRequest;
      if (!mReq.file) {
        console.log("No file in request");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("File received:", mReq.file.originalname, mReq.file.mimetype, mReq.file.size);

      let text = "";
      const mimetype = mReq.file.mimetype;

      if (mimetype === "application/pdf") {
        console.log("Processing PDF...");
        // Handle different export styles of pdf-parse across versions
        const parsePdf = typeof pdf === 'function' 
          ? pdf 
          : (pdf && typeof pdf.PDFParse === 'function' 
              ? pdf.PDFParse 
              : (pdf && pdf.default && typeof pdf.default === 'function' ? pdf.default : null));
        
        if (!parsePdf) {
          console.error("DEBUG: pdf content keys:", Object.keys(pdf || {}));
          throw new Error(`pdf-parse is not a function. Available keys: ${Object.keys(pdf || {}).join(', ')}`);
        }

        // Add a timeout for PDF parsing as it can be CPU intensive
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("PDF parsing timed out")), 25000)
        );

        const data = await Promise.race([parsePdf(mReq.file.buffer), timeoutPromise]) as any;
        text = data.text;
        console.log("PDF text extracted, length:", text.length);
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        mimetype === "application/msword"
      ) {
        console.log("Processing Word doc...");
        const result = await mammoth.extractRawText({ buffer: mReq.file.buffer });
        text = result.value;
        console.log("Word text extracted, length:", text.length);
      } else {
        console.log("Unsupported mimetype:", mimetype);
        return res.status(400).json({ error: "Unsupported file format. Use PDF or DOCX." });
      }

      console.log("Sending success response");
      res.json({ text });
    } catch (error) {
      console.error("Text extraction error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to extract text from resume" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler MUST be last
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Server error occurred", details: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import mammoth from "mammoth";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// ✅ Safe require
const require = createRequire(import.meta.url);

// ✅ Safe pdf import (prevents crash)
let pdf: any;
try {
  pdf = require("pdf-parse");
} catch (e) {
  console.warn("pdf-parse not loaded");
}

interface MulterRequest extends express.Request {
  file?: Express.Multer.File;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // ✅ IMPORTANT: Render dynamic port
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Multer setup
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  // ✅ Resume text extraction API
  app.post("/api/extract-text", upload.single("resume"), async (req, res) => {
    try {
      const mReq = req as MulterRequest;

      if (!mReq.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";
      const mimetype = mReq.file.mimetype;

      // 📄 PDF
      if (mimetype === "application/pdf") {
        if (!pdf) {
          return res.status(500).json({ error: "PDF parser not available" });
        }

        const parsePdf =
          typeof pdf === "function"
            ? pdf
            : pdf?.default || pdf?.PDFParse;

        if (!parsePdf) {
          throw new Error("Invalid pdf parser");
        }

        const data = await parsePdf(mReq.file.buffer);
        text = data.text;
      }

      // 📄 DOCX
      else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/msword"
      ) {
        const result = await mammoth.extractRawText({
          buffer: mReq.file.buffer
        });
        text = result.value;
      }

      // ❌ Unsupported
      else {
        return res.status(400).json({
          error: "Use PDF or DOCX format only"
        });
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({
        error: error.message || "Failed to extract text"
      });
    }
  });

  // ✅ Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ✅ Serve frontend (PRODUCTION ONLY)
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // 🔧 Dev only (optional Vite)
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }

  // ✅ Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import mammoth from "mammoth";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Safe PDF import
let pdf: any;
try {
  pdf = require("pdf-parse");
} catch {
  console.warn("pdf-parse not loaded");
}

interface MulterRequest extends express.Request {
  file?: Express.Multer.File;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// File upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// API
app.post("/api/extract-text", upload.single("resume"), async (req, res) => {
  try {
    const mReq = req as MulterRequest;

    if (!mReq.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let text = "";
    const mimetype = mReq.file.mimetype;

    if (mimetype === "application/pdf") {
      if (!pdf) return res.status(500).json({ error: "PDF not supported" });

      const parsePdf =
        typeof pdf === "function" ? pdf : pdf?.default || pdf?.PDFParse;

      const data = await parsePdf(mReq.file.buffer);
      text = data.text;
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({
        buffer: mReq.file.buffer
      });
      text = result.value;
    } else {
      return res.status(400).json({ error: "Use PDF or DOCX" });
    }

    res.json({ text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Extraction failed" });
  }
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend (production)
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
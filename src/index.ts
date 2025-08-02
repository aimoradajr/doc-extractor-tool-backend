import express from "express";
import cors from "cors";
import multer from "multer";
import pdf from "pdf-parse";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS for frontend
app.use(cors());

// Body parsing
app.use(express.json());

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

app.get("/", (req, res) => {
  res.json({
    message: "PDF Document Extraction Tool API",
    status: "OK",
    version: "1.0.0",
  });
});

// Upload PDF endpoint
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "File must be a PDF" });
  }

  try {
    // Read and extract text from PDF
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdf(buffer);

    res.json({
      message: "PDF processed successfully",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      extracted: {
        text: data.text,
        pages: data.numpages,
        textLength: data.text.length,
      },
    });
  } catch (error) {
    console.error("PDF parsing error:", error);
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

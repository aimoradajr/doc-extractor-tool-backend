import multer from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";

// File upload configuration with proper filename handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Generate a unique filename while preserving the .pdf extension
    const uniqueName = crypto.randomBytes(16).toString("hex");
    const extension = path.extname(file.originalname); // Should be .pdf
    cb(null, uniqueName + extension);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Validation middleware
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  next();
};

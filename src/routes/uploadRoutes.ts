import express from "express";
import { uploadController } from "../controllers/uploadController";
import { upload, validateFileUpload } from "../middleware/uploadMiddleware";

const router = express.Router();

// Routes
router.post(
  "/upload",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.uploadPdf
);

// New route for structured extraction
router.post(
  "/extract",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.extractStructuredData
);

export default router;

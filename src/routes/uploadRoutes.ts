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

router.post(
  "/extract",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.extractStructuredData
);

// NEW ROUTE USING PDF2JSON
router.post(
  "/upload2",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.uploadPdf2
);

export default router;

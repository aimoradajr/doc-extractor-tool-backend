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

export default router;

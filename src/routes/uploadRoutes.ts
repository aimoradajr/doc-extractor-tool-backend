import express from "express";
import { uploadController } from "../controllers/uploadController";
import { upload, validateFileUpload } from "../middleware/uploadMiddleware";

const router = express.Router();

// Extract using OpenAI Chat Completions API
router.post(
  "/extract",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.extractStructuredData
);

// Extract using OpenAI Responses API
router.post(
  "/extract2",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.extractStructuredData_WithResponsesAPI
);

// TEST ROUTES ---------------------------------------------

// Test route: upload and pdf parse
router.post(
  "/upload",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.uploadPdf
);

// Test route: upload and pdf2json
router.post(
  "/upload2",
  upload.single("pdf"),
  validateFileUpload,
  uploadController.uploadPdf2
);

export default router;

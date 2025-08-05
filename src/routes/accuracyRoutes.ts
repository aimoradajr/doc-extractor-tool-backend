import express from "express";
import { accuracyController } from "../controllers/accuracyController";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

// 🎯 MAIN ACCURACY TEST ROUTE - Handles both upload and preset modes
// POST /api/accuracy/test
// Body: { "mode": "upload" } + files OR { "mode": "preset", "preset": "preset1", "extract_mode": "extract|extract1|extract2|extract3" }
router.post(
  "/test",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "groundTruth", maxCount: 1 },
  ]),
  accuracyController.testAccuracy
);

// 📋 GET AVAILABLE PRESETS
// GET /api/accuracy/presets
router.get("/presets", accuracyController.getPresets);

export default router;

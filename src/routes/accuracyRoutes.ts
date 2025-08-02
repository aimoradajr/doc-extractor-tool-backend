import express from "express";
import { accuracyController } from "../controllers/accuracyController";

const router = express.Router();

// Get available test cases
router.get("/test-cases", accuracyController.getTestCases);

// Run specific test case
router.post("/test/:testId", accuracyController.runTest);

export default router;

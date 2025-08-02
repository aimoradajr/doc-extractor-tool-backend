import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { pdfService } from "../services/pdfService";
import { accuracyService } from "../services/accuracyService";
import { AccuracyTestResult, TestCase } from "../types/types";

export class AccuracyController {
  // Get available test cases
  getTestCases = (req: Request, res: Response) => {
    try {
      const testDataDir = path.join(__dirname, "../../test-data");
      const pdfDir = path.join(testDataDir, "pdfs");
      const groundTruthDir = path.join(testDataDir, "ground-truth");

      if (!fs.existsSync(pdfDir) || !fs.existsSync(groundTruthDir)) {
        return res.json({ testCases: [] });
      }

      const testCases: TestCase[] = fs
        .readdirSync(pdfDir)
        .filter((file) => file.endsWith(".pdf"))
        .map((file) => {
          const baseName = path.basename(file, ".pdf");
          const groundTruthPath = path.join(groundTruthDir, `${baseName}.json`);

          return {
            id: baseName,
            name: baseName
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            pdfPath: path.join(pdfDir, file),
            groundTruthPath,
            hasGroundTruth: fs.existsSync(groundTruthPath),
          };
        })
        .filter((tc) => tc.hasGroundTruth);

      res.json({ testCases });
    } catch (error) {
      console.error("Failed to get test cases:", error);
      res.status(500).json({ error: "Failed to get test cases" });
    }
  };

  // Run accuracy test on specific test case
  runTest = async (req: Request, res: Response) => {
    try {
      const { testId } = req.params;

      const testDataDir = path.join(__dirname, "../../test-data");
      const pdfPath = path.join(testDataDir, "pdfs", `${testId}.pdf`);
      const groundTruthPath = path.join(
        testDataDir,
        "ground-truth",
        `${testId}.json`
      );

      if (!fs.existsSync(pdfPath) || !fs.existsSync(groundTruthPath)) {
        return res.status(404).json({ error: "Test case not found" });
      }

      console.log(`Running accuracy test for: ${testId}`);

      // Extract data from PDF
      const extractedData = await pdfService.extractStructuredData(pdfPath);

      // Load ground truth
      const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, "utf-8"));

      // Calculate accuracy
      const accuracyResult = accuracyService.calculateAccuracy(
        extractedData,
        groundTruth
      );

      const result: AccuracyTestResult = {
        testCase: testId,
        metrics: accuracyResult.metrics,
        details: accuracyResult.details,
      };

      // Save result for reference
      const resultsDir = path.join(testDataDir, "results");
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(resultsDir, `${testId}-result.json`),
        JSON.stringify({ extractedData, accuracyResult }, null, 2)
      );

      console.log(`Accuracy test completed for ${testId}`);
      res.json(result);
    } catch (error) {
      console.error("Accuracy test failed:", error);
      res.status(500).json({ error: "Accuracy test failed" });
    }
  };

  // Upload custom test (PDF + ground truth JSON)
  uploadTest = async (req: Request, res: Response) => {
    try {
      if (!req.files || !req.files["pdf"] || !req.files["groundTruth"]) {
        return res
          .status(400)
          .json({ error: "Both PDF and ground truth JSON files are required" });
      }

      const pdfFile = Array.isArray(req.files["pdf"])
        ? req.files["pdf"][0]
        : req.files["pdf"];
      const groundTruthFile = Array.isArray(req.files["groundTruth"])
        ? req.files["groundTruth"][0]
        : req.files["groundTruth"];

      // Extract data from uploaded PDF
      const extractedData = await pdfService.extractStructuredData(
        pdfFile.path
      );

      // Parse uploaded ground truth
      const groundTruthContent = fs.readFileSync(groundTruthFile.path, "utf-8");
      const groundTruth = JSON.parse(groundTruthContent);

      // Calculate accuracy
      const accuracyResult = accuracyService.calculateAccuracy(
        extractedData,
        groundTruth
      );

      const result: AccuracyTestResult = {
        testCase: pdfFile.originalname || "uploaded",
        metrics: accuracyResult.metrics,
        details: accuracyResult.details,
      };

      res.json(result);
    } catch (error) {
      console.error("Upload test failed:", error);
      res.status(500).json({ error: "Upload test failed" });
    }
  };
}

export const accuracyController = new AccuracyController();

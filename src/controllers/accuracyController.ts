import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { pdfService } from "../services/pdfService";
import { accuracyService } from "../services/accuracyService";
import { AccuracyTestResult } from "../types/types";

// 🎯 PRESET TEST CASES - Easy to add new ones!
const PRESET_TESTS = {
  preset1: {
    name: "Bell Creek Muddy Creek Watershed Plan 2012",
    pdfFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.pdf",
    groundTruthFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.json",
  },
  preset2: {
    name: "Sample Watershed Report A",
    pdfFile: "sample-watershed-a.pdf",
    groundTruthFile: "sample-watershed-a.json",
  },
  preset3: {
    name: "Sample Watershed Report B",
    pdfFile: "sample-watershed-b.pdf",
    groundTruthFile: "sample-watershed-b.json",
  },
} as const;

export class AccuracyController {
  // 🚀 MAIN ACCURACY TEST ROUTE - Handles both modes elegantly
  testAccuracy = async (req: Request, res: Response) => {
    try {
      const { mode } = req.body;

      if (mode === "upload") {
        return await this.handleUploadMode(req, res);
      } else if (mode === "preset") {
        return await this.handlePresetMode(req, res);
      } else {
        return res.status(400).json({
          error: "Invalid mode. Use 'upload' or 'preset'",
        });
      }
    } catch (error) {
      console.error("❌ Accuracy test failed:", error);
      res.status(500).json({ error: "Accuracy test failed" });
    }
  };

  // 📄 UPLOAD MODE - User provides PDF + ground truth
  private handleUploadMode = async (req: Request, res: Response) => {
    // Type guard for multer files
    if (!req.files || Array.isArray(req.files)) {
      return res.status(400).json({
        error:
          "Both 'pdf' and 'groundTruth' files are required for upload mode",
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files["pdf"] || !files["groundTruth"]) {
      return res.status(400).json({
        error: "Both 'pdf' and 'groundTruth' files are required",
      });
    }

    const pdfFile = files["pdf"][0];
    const groundTruthFile = files["groundTruth"][0];

    console.log(`📊 Testing uploaded PDF: ${pdfFile.originalname}`);

    // Extract data from uploaded PDF
    const extractedData = await pdfService.extractStructuredData(pdfFile.path);

    // Parse uploaded ground truth
    const groundTruthContent = fs.readFileSync(groundTruthFile.path, "utf-8");
    const groundTruth = JSON.parse(groundTruthContent);

    // Calculate accuracy
    const accuracyResult = accuracyService.calculateAccuracy(
      extractedData,
      groundTruth
    );

    const result: AccuracyTestResult = {
      testCase: `uploaded-${pdfFile.originalname}`,
      metrics: accuracyResult.metrics,
      details: accuracyResult.details,
    };

    res.json(result);
  };

  // 🎯 PRESET MODE - Use predefined test cases
  private handlePresetMode = async (req: Request, res: Response) => {
    const { preset } = req.body;

    if (!preset || !PRESET_TESTS[preset as keyof typeof PRESET_TESTS]) {
      return res.status(400).json({
        error: `Invalid preset. Available: ${Object.keys(PRESET_TESTS).join(
          ", "
        )}`,
      });
    }

    const testCase = PRESET_TESTS[preset as keyof typeof PRESET_TESTS];
    const testDataDir = path.join(__dirname, "../../test-data");
    const pdfPath = path.join(testDataDir, "pdfs", testCase.pdfFile);
    const groundTruthPath = path.join(
      testDataDir,
      "ground-truth",
      testCase.groundTruthFile
    );

    // Check if files exist
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        error: `PDF file not found: ${testCase.pdfFile}`,
      });
    }

    if (!fs.existsSync(groundTruthPath)) {
      return res.status(404).json({
        error: `Ground truth file not found: ${testCase.groundTruthFile}`,
      });
    }

    console.log(`🎯 Testing preset: ${preset} (${testCase.name})`);

    // Extract data from preset PDF
    const extractedData = await pdfService.extractStructuredData(pdfPath);

    // Load preset ground truth
    const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, "utf-8"));

    // Calculate accuracy
    const accuracyResult = accuracyService.calculateAccuracy(
      extractedData,
      groundTruth
    );

    const result: AccuracyTestResult = {
      testCase: `${preset}-${testCase.name}`,
      metrics: accuracyResult.metrics,
      details: accuracyResult.details,
    };

    // Save result for reference
    const resultsDir = path.join(testDataDir, "results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(resultsDir, `${preset}-result.json`),
      JSON.stringify({ extractedData, accuracyResult }, null, 2)
    );

    res.json(result);
  };

  // 📋 LIST AVAILABLE PRESETS
  getPresets = (req: Request, res: Response) => {
    const presets = Object.entries(PRESET_TESTS).map(([key, value]) => ({
      id: key,
      name: value.name,
      pdfFile: value.pdfFile,
      groundTruthFile: value.groundTruthFile,
    }));

    res.json({ presets });
  };
}

export const accuracyController = new AccuracyController();

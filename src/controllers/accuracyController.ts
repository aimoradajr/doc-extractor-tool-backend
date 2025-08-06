import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { pdfService } from "../services/pdfService";
import { accuracyService } from "../services/accuracyService";
import { AccuracyTestResult } from "../types/types";

// EASY MODEL SWITCHING - Now configured via .env (COMPARE_MODEL)
const COMPARE_MODEL = process.env.COMPARE_MODEL || "gpt-4.1";

// PRESET TEST CASES - Easy to add new ones!
const PRESET_TESTS = {
  preset1: {
    name: "Broken Pumpkin 9 Key Element Plan 2019",
    pdfFile: "Broken_Pumpkin_9_Key_Element_Plan_2019.pdf",
    pdfFileSize: "939 KB",
    groundTruthFile: "Broken_Pumpkin_9_Key_Element_Plan_2019.json",
  },
  preset2: {
    name: "Basket Creek Hickahala Creek 9 Key Element Plan 2018",
    pdfFile: "Basket_Creek_Hickahala_Creek_9_Key_Element_Plan_2018.pdf",
    pdfFileSize: "1.04 MB",
    groundTruthFile:
      "Basket_Creek_Hickahala_Creek_9_Key_Element_Plan_2018.json",
  },
  preset3: {
    name: "Pickwick Reservoir Watershed Plan 2009",
    pdfFile: "Pickwick_Reservoir_Watershed_Plan_2009.pdf",
    pdfFileSize: "6.73 MB",
    groundTruthFile: "Pickwick_Reservoir_Watershed_Plan_2009.json",
  },
  preset4: {
    name: "Bell Creek Muddy Creek Watershed Plan 2012",
    pdfFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.pdf",
    pdfFileSize: "1.79 MB",
    groundTruthFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.json",
  },
} as const;

export class AccuracyController {
  // MAIN ACCURACY TEST ROUTE - Handles both modes elegantly
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
      console.error("Accuracy test failed:", error);
      res.status(500).json({ error: "Accuracy test failed" });
    }
  };

  // UPLOAD MODE - User provides PDF + ground truth
  private handleUploadMode = async (req: Request, res: Response) => {
    throw new Error("Upload mode is not supported");
  };

  // PRESET MODE - Use predefined test cases
  private handlePresetMode = async (req: Request, res: Response) => {
    const { preset, extract_mode } = req.body;

    if (!preset || !PRESET_TESTS[preset as keyof typeof PRESET_TESTS]) {
      return res.status(400).json({
        error: `Invalid preset. Available: ${Object.keys(PRESET_TESTS).join(
          ", "
        )}`,
      });
    }

    // Validate extract_mode parameter
    const extractMode = extract_mode || "extract"; // Default to 'extract'
    if (
      !["extract", "extract1", "extract2", "extract3"].includes(extractMode)
    ) {
      return res.status(400).json({
        error: `Invalid extract_mode. Available: extract, extract1, extract2, extract3`,
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

    // Get comparison mode from request body
    const compareMode = req.body.compare_mode || "ai"; // ai or default
    const compareModeModel = req.body.compare_mode_model || COMPARE_MODEL;

    console.log(
      `Testing preset: ${preset} (${testCase.name}) with ${compareMode} comparison mode using ${extractMode} extraction`
    );

    // Extract data from preset PDF using the specified extract mode
    let extractedData;
    if (extractMode === "extract2") {
      console.log("Using extract2 (Responses API - text input) for extraction");
      extractedData = await pdfService.extractStructuredData_WithResponsesAPI(
        pdfPath,
        false
      );
    } else if (extractMode === "extract3") {
      console.log(
        "Using extract3 (Responses API - direct file upload) for extraction"
      );
      extractedData = await pdfService.extractStructuredData_WithResponsesAPI(
        pdfPath,
        true
      );
    } else {
      console.log(
        "Using extract/extract1 (Chat Completions API) for extraction"
      );
      extractedData = await pdfService.extractStructuredData(pdfPath);
    }

    // Load preset ground truth
    const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, "utf-8"));

    // Calculate accuracy based on mode
    let accuracyResult: AccuracyTestResult;
    if (compareMode === "ai") {
      console.log(`Using AI comparison with model: ${compareModeModel}`);
      accuracyResult = await accuracyService.calculateAccuracyWithAI(
        extractedData,
        groundTruth,
        compareModeModel
      );
    } else {
      console.log("Using default code-based comparison");
      accuracyResult = accuracyService.calculateAccuracy(
        extractedData,
        groundTruth
      );
    }

    const result: AccuracyTestResult = {
      testCase: `${preset}-${testCase.name}`,
      extract_ai_model: extractedData.model, // The model used for extraction
      extract_mode: extractMode, // The extraction mode used (extract/extract1 or extract2)
      compare_ai_model: compareMode === "ai" ? compareModeModel : undefined, // Only set if AI comparison is used
      compare_mode: compareMode, // The comparison mode used
      metrics: accuracyResult.metrics,
      details: accuracyResult.details,
      // Include both datasets for comparison
      comparison: {
        expected: groundTruth,
        actual: extractedData,
      },
      // Include detailed comparisons for debugging
      detailedComparisons: accuracyResult.detailedComparisons,
    };

    // Save result for reference
    const resultsDir = path.join(testDataDir, "results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(resultsDir, `${preset}-${extractMode}-result.json`),
      JSON.stringify({ extractedData, accuracyResult }, null, 2)
    );

    res.json(result);
  };

  // LIST AVAILABLE PRESETS
  getPresets = (req: Request, res: Response) => {
    const presets = Object.entries(PRESET_TESTS).map(([key, value]) => ({
      id: key,
      name: value.name,
      pdfFile: value.pdfFile,
      pdfFileSize: value.pdfFileSize,
      groundTruthFile: value.groundTruthFile,
    }));

    res.json({ presets });
  };
}

export const accuracyController = new AccuracyController();

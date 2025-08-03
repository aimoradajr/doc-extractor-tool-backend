import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { pdfService } from "../services/pdfService";
import { accuracyService } from "../services/accuracyService";
import { AccuracyTestResult } from "../types/types";

// PRESET TEST CASES - Easy to add new ones!
const PRESET_TESTS = {
  preset1: {
    name: "Bell Creek Muddy Creek Watershed Plan 2012",
    pdfFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.pdf",
    groundTruthFile: "Bell_Creek_Muddy_Creek_Watershed_Plan_2012.json",
  },
  preset2: {
    name: "Basket Creek Hickahala Creek 9 Key Element Plan 2018",
    pdfFile: "Basket_Creek_Hickahala_Creek_9_Key_Element_Plan_2018.pdf",
    groundTruthFile:
      "Basket_Creek_Hickahala_Creek_9_Key_Element_Plan_2018.json",
  },
  preset3: {
    name: "Pickwick Reservoir Watershed Plan 2009",
    pdfFile: "Pickwick_Reservoir_Watershed_Plan_2009.pdf",
    groundTruthFile: "Pickwick_Reservoir_Watershed_Plan_2009.json",
  },
  preset4: {
    name: "Broken Pumpkin 9 Key Element Plan 2019",
    pdfFile: "Broken_Pumpkin_9_Key_Element_Plan_2019.pdf",
    groundTruthFile: "Broken_Pumpkin_9_Key_Element_Plan_2019.json",
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

    console.log(`Testing uploaded PDF: ${pdfFile.originalname}`);

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
      model: extractedData.model, // Include the model used
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

    res.json(result);
  };

  // PRESET MODE - Use predefined test cases
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

    console.log(`Testing preset: ${preset} (${testCase.name})`);

    // Extract data from preset PDF
    const extractedData = await pdfService.extractStructuredData(pdfPath);

    // Load preset ground truth
    const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, "utf-8"));

    // DEBUG: Log data structures for comparison
    console.log(`DEBUG: Comparing data structures for ${preset}...`);
    console.log(`Ground Truth Goals: ${groundTruth.goals?.length || 0}`);
    console.log(`Extracted Goals: ${extractedData.goals?.length || 0}`);
    console.log(`Ground Truth BMPs: ${groundTruth.bmps?.length || 0}`);
    console.log(`Extracted BMPs: ${extractedData.bmps?.length || 0}`);
    console.log(
      `Ground Truth Implementation: ${groundTruth.implementation?.length || 0}`
    );
    console.log(
      `Extracted Implementation: ${extractedData.implementation?.length || 0}`
    );

    // Calculate accuracy
    const accuracyResult = accuracyService.calculateAccuracy(
      extractedData,
      groundTruth
    );

    const result: AccuracyTestResult = {
      testCase: `${preset}-${testCase.name}`,
      model: extractedData.model, // Include the model used
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
      path.join(resultsDir, `${preset}-result.json`),
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
      groundTruthFile: value.groundTruthFile,
    }));

    res.json({ presets });
  };
}

export const accuracyController = new AccuracyController();

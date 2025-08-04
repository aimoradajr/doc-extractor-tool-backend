import {
  ExtractedData,
  AccuracyTestResult,
  AccuracyMetric,
  ComparisonDetail,
} from "../types/types";
import { openAIService } from "./openAIService";

export class AccuracyService {
  async calculateAccuracyWithAI(
    extracted: ExtractedData,
    groundTruth: ExtractedData,
    model: string = "gpt-4.1"
  ): Promise<AccuracyTestResult> {
    console.log(`Using AI comparison with model: ${model}`);
    return await openAIService.compareWithAI(extracted, groundTruth, model);
  }

  calculateAccuracy(
    extracted: ExtractedData,
    groundTruth: ExtractedData
  ): AccuracyTestResult {
    // Calculate accuracy metrics and detailed comparisons
    const goalResults = this.compareGoalsDetailed(
      extracted.goals || [],
      groundTruth.goals || []
    );
    const bmpResults = this.compareBMPsDetailed(
      extracted.bmps || [],
      groundTruth.bmps || []
    );
    const implResults = this.compareImplementationDetailed(
      extracted.implementation || [],
      groundTruth.implementation || []
    );
    const monitoringResults = this.compareMonitoringDetailed(
      extracted.monitoring || [],
      groundTruth.monitoring || []
    );
    const outreachResults = this.compareOutreachDetailed(
      extracted.outreach || [],
      groundTruth.outreach || []
    );
    const geographicAreasResults = this.compareGeographicAreasDetailed(
      extracted.geographicAreas || [],
      groundTruth.geographicAreas || []
    );

    const overallPrecision =
      (goalResults.accuracy.precision +
        bmpResults.accuracy.precision +
        implResults.accuracy.precision +
        monitoringResults.accuracy.precision +
        outreachResults.accuracy.precision +
        geographicAreasResults.accuracy.precision) /
      6;
    const overallRecall =
      (goalResults.accuracy.recall +
        bmpResults.accuracy.recall +
        implResults.accuracy.recall +
        monitoringResults.accuracy.recall +
        outreachResults.accuracy.recall +
        geographicAreasResults.accuracy.recall) /
      6;
    const overallF1 = this.calculateF1(overallPrecision, overallRecall);

    return {
      testCase: "test",
      metrics: {
        precision: overallPrecision,
        recall: overallRecall,
        f1Score: overallF1,
      },
      details: {
        goals: goalResults.accuracy,
        bmps: bmpResults.accuracy,
        implementation: implResults.accuracy,
        monitoring: monitoringResults.accuracy,
        outreach: outreachResults.accuracy,
        geographicAreas: geographicAreasResults.accuracy,
      },
      detailedComparisons: {
        goals: goalResults.comparisons,
        bmps: bmpResults.comparisons,
        implementation: implResults.comparisons,
        monitoring: monitoringResults.comparisons,
        outreach: outreachResults.comparisons,
        geographicAreas: geographicAreasResults.comparisons,
      },
    };
  }

  // ========================================
  // DETAILED COMPARISON METHODS
  // ========================================

  private compareGoalsDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted goal against ground truth
    for (const extractedGoal of extracted) {
      const extractedText =
        extractedGoal.objective || extractedGoal.description;
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedText, gt.objective || gt.description)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "goals",
          expected: match.objective || match.description,
          actual: extractedText,
          message: `Found expected goal: "${extractedText}"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "goals",
          expected: null,
          actual: extractedText,
          message: `Found unexpected goal: "${extractedText}" (not in ground truth)`,
        });
      }
    }

    // Check for missing goals (in ground truth but not extracted)
    for (const gtGoal of groundTruth) {
      const gtText = gtGoal.objective || gtGoal.description;
      const found = extracted.find((ext) =>
        this.fuzzyMatch(ext.objective || ext.description, gtText)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "goals",
          expected: gtText,
          actual: null,
          message: `Missing expected goal: "${gtText}"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private compareBMPsDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted BMP against ground truth
    for (const extractedBMP of extracted) {
      const extractedText = extractedBMP.name || extractedBMP.description;
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(
          extractedText,
          gt.name || gt.description,
          0.7,
          !!extractedBMP.name && !!gt.name
        )
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "bmps",
          expected: match.name || match.description,
          actual: extractedText,
          message: `Found expected BMP: "${extractedText}"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "bmps",
          expected: null,
          actual: extractedText,
          message: `Found unexpected BMP: "${extractedText}" (not in ground truth)`,
        });
      }
    }

    // Check for missing BMPs
    for (const gtBMP of groundTruth) {
      const gtText = gtBMP.name || gtBMP.description;
      const found = extracted.find((ext) =>
        this.fuzzyMatch(
          ext.name || ext.description,
          gtText,
          0.7,
          !!ext.name && !!gtBMP.name
        )
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "bmps",
          expected: gtText,
          actual: null,
          message: `Missing expected BMP: "${gtText}"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private compareImplementationDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted implementation against ground truth
    for (const extractedImpl of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedImpl.description, gt.description)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "implementation",
          expected: match.description,
          actual: extractedImpl.description,
          message: `Found expected implementation: "${extractedImpl.description}"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "implementation",
          expected: null,
          actual: extractedImpl.description,
          message: `Found unexpected implementation: "${extractedImpl.description}" (not in ground truth)`,
        });
      }
    }

    // Check for missing implementations
    for (const gtImpl of groundTruth) {
      const found = extracted.find((ext) =>
        this.fuzzyMatch(ext.description, gtImpl.description)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "implementation",
          expected: gtImpl.description,
          actual: null,
          message: `Missing expected implementation: "${gtImpl.description}"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private compareMonitoringDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted monitoring against ground truth
    for (const extractedMon of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedMon.description, gt.description)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "monitoring",
          expected: match.description,
          actual: extractedMon.description,
          message: `Found expected monitoring: "${extractedMon.description}"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "monitoring",
          expected: null,
          actual: extractedMon.description,
          message: `Found unexpected monitoring: "${extractedMon.description}" (not in ground truth)`,
        });
      }
    }

    // Check for missing monitoring
    for (const gtMon of groundTruth) {
      const found = extracted.find((ext) =>
        this.fuzzyMatch(ext.description, gtMon.description)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "monitoring",
          expected: gtMon.description,
          actual: null,
          message: `Missing expected monitoring: "${gtMon.description}"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private compareOutreachDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted outreach against ground truth
    for (const extractedOutreach of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedOutreach.description, gt.description)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "outreach",
          expected: match.description,
          actual: extractedOutreach.description,
          message: `Found expected outreach: "${extractedOutreach.description}"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "outreach",
          expected: null,
          actual: extractedOutreach.description,
          message: `Found unexpected outreach: "${extractedOutreach.description}" (not in ground truth)`,
        });
      }
    }

    // Check for missing outreach
    for (const gtOutreach of groundTruth) {
      const found = extracted.find((ext) =>
        this.fuzzyMatch(ext.description, gtOutreach.description)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "outreach",
          expected: gtOutreach.description,
          actual: null,
          message: `Missing expected outreach: "${gtOutreach.description}"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private compareGeographicAreasDetailed(
    extracted: any[],
    groundTruth: any[]
  ): { accuracy: AccuracyMetric; comparisons: ComparisonDetail[] } {
    const comparisons: ComparisonDetail[] = [];
    let correctCount = 0;

    // Check each extracted geographic area against ground truth
    for (const extractedArea of extracted) {
      const match = groundTruth.find(
        (gt) =>
          this.fuzzyMatch(extractedArea.name, gt.name) ||
          this.fuzzyMatch(extractedArea.description, gt.description) ||
          (extractedArea.huc && gt.huc && extractedArea.huc === gt.huc)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "geographicAreas",
          expected: match.name || match.description || match.huc,
          actual:
            extractedArea.name ||
            extractedArea.description ||
            extractedArea.huc,
          message: `Found expected geographic area: "${
            extractedArea.name || extractedArea.description
          }"`,
        });
      } else {
        comparisons.push({
          type: "surplus_actual",
          category: "geographicAreas",
          expected: null,
          actual:
            extractedArea.name ||
            extractedArea.description ||
            extractedArea.huc,
          message: `Found unexpected geographic area: "${
            extractedArea.name || extractedArea.description
          }" (not in ground truth)`,
        });
      }
    }

    // Check for missing geographic areas
    for (const gtArea of groundTruth) {
      const found = extracted.find(
        (ext) =>
          this.fuzzyMatch(ext.name, gtArea.name) ||
          this.fuzzyMatch(ext.description, gtArea.description) ||
          (ext.huc && gtArea.huc && ext.huc === gtArea.huc)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "geographicAreas",
          expected: gtArea.name || gtArea.description || gtArea.huc,
          actual: null,
          message: `Missing expected geographic area: "${
            gtArea.name || gtArea.description
          }"`,
        });
      }
    }

    return {
      accuracy: this.calculateMetric(
        correctCount,
        extracted.length,
        groundTruth.length
      ),
      comparisons,
    };
  }

  private fuzzyMatch(
    text1: string,
    text2: string,
    threshold: number = 0.7,
    requireExactForNames: boolean = false
  ): boolean {
    if (!text1 || !text2) return false;

    const clean1 = text1.toLowerCase().trim();
    const clean2 = text2.toLowerCase().trim();

    // For names and exact content, require exact match to avoid false positives
    if (requireExactForNames) {
      return clean1 === clean2;
    }

    // Simple similarity check - can be improved with proper string similarity algorithms
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

    const words1 = clean1.split(" ");
    const words2 = clean2.split(" ");
    const commonWords = words1.filter((word) => words2.includes(word));

    return (
      commonWords.length / Math.max(words1.length, words2.length) >= threshold
    );
  }

  private calculateMetric(
    correctCount: number,
    totalExtracted: number,
    totalExpected: number
  ): AccuracyMetric {
    const precision = totalExtracted > 0 ? correctCount / totalExtracted : 0;
    const recall = totalExpected > 0 ? correctCount / totalExpected : 0;
    const f1Score = this.calculateF1(precision, recall);

    return {
      precision,
      recall,
      f1Score,
      correctCount,
      totalExtracted,
      totalExpected,
    };
  }

  private calculateF1(precision: number, recall: number): number {
    return precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  }
}

export const accuracyService = new AccuracyService();

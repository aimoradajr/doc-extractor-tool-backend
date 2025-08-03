import {
  ExtractedData,
  AccuracyTestResult,
  AccuracyMetric,
  ComparisonDetail,
} from "../types/types";

export class AccuracyService {
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

    const overallPrecision =
      (goalResults.accuracy.precision +
        bmpResults.accuracy.precision +
        implResults.accuracy.precision +
        monitoringResults.accuracy.precision) /
      4;
    const overallRecall =
      (goalResults.accuracy.recall +
        bmpResults.accuracy.recall +
        implResults.accuracy.recall +
        monitoringResults.accuracy.recall) /
      4;
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
      },
      detailedComparisons: {
        goals: goalResults.comparisons,
        bmps: bmpResults.comparisons,
        implementation: implResults.comparisons,
        monitoring: monitoringResults.comparisons,
      },
    };
  }

  private compareGoals(extracted: any[], groundTruth: any[]): AccuracyMetric {
    let correctCount = 0;

    for (const extractedGoal of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(
          extractedGoal.title || extractedGoal.description,
          gt.title || gt.description
        )
      );
      if (match) correctCount++;
    }

    return this.calculateMetric(
      correctCount,
      extracted.length,
      groundTruth.length
    );
  }

  private compareBMPs(extracted: any[], groundTruth: any[]): AccuracyMetric {
    let correctCount = 0;

    for (const extractedBMP of extracted) {
      const match = groundTruth.find((gt) =>
        // Use exact matching for BMP names to avoid false positives
        this.fuzzyMatch(
          extractedBMP.name || extractedBMP.description,
          gt.name || gt.description,
          0.7,
          !!extractedBMP.name && !!gt.name // Exact match if both have names
        )
      );
      if (match) correctCount++;
    }

    return this.calculateMetric(
      correctCount,
      extracted.length,
      groundTruth.length
    );
  }

  private compareImplementation(
    extracted: any[],
    groundTruth: any[]
  ): AccuracyMetric {
    let correctCount = 0;

    for (const extractedImpl of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedImpl.description, gt.description)
      );
      if (match) correctCount++;
    }

    return this.calculateMetric(
      correctCount,
      extracted.length,
      groundTruth.length
    );
  }

  private compareMonitoring(
    extracted: any[],
    groundTruth: any[]
  ): AccuracyMetric {
    let correctCount = 0;

    for (const extractedMon of extracted) {
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedMon.description, gt.description)
      );
      if (match) correctCount++;
    }

    return this.calculateMetric(
      correctCount,
      extracted.length,
      groundTruth.length
    );
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
      const extractedText = extractedGoal.title || extractedGoal.description;
      const match = groundTruth.find((gt) =>
        this.fuzzyMatch(extractedText, gt.title || gt.description)
      );

      if (match) {
        correctCount++;
        comparisons.push({
          type: "perfect_match",
          category: "goals",
          expected: match.title || match.description,
          actual: extractedText,
          message: `✅ Found expected goal: "${extractedText}"`,
        });
      } else {
        comparisons.push({
          type: "unexpected_extra",
          category: "goals",
          expected: null,
          actual: extractedText,
          message: `❓ Found unexpected goal: "${extractedText}" (not in ground truth)`,
        });
      }
    }

    // Check for missing goals (in ground truth but not extracted)
    for (const gtGoal of groundTruth) {
      const gtText = gtGoal.title || gtGoal.description;
      const found = extracted.find((ext) =>
        this.fuzzyMatch(ext.title || ext.description, gtText)
      );

      if (!found) {
        comparisons.push({
          type: "missing_expected",
          category: "goals",
          expected: gtText,
          actual: null,
          message: `❌ Missing expected goal: "${gtText}"`,
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
          message: `✅ Found expected BMP: "${extractedText}"`,
        });
      } else {
        comparisons.push({
          type: "unexpected_extra",
          category: "bmps",
          expected: null,
          actual: extractedText,
          message: `❓ Found unexpected BMP: "${extractedText}" (not in ground truth)`,
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
          message: `❌ Missing expected BMP: "${gtText}"`,
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
          message: `✅ Found expected implementation: "${extractedImpl.description}"`,
        });
      } else {
        comparisons.push({
          type: "unexpected_extra",
          category: "implementation",
          expected: null,
          actual: extractedImpl.description,
          message: `❓ Found unexpected implementation: "${extractedImpl.description}" (not in ground truth)`,
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
          message: `❌ Missing expected implementation: "${gtImpl.description}"`,
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
          message: `✅ Found expected monitoring: "${extractedMon.description}"`,
        });
      } else {
        comparisons.push({
          type: "unexpected_extra",
          category: "monitoring",
          expected: null,
          actual: extractedMon.description,
          message: `❓ Found unexpected monitoring: "${extractedMon.description}" (not in ground truth)`,
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
          message: `❌ Missing expected monitoring: "${gtMon.description}"`,
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

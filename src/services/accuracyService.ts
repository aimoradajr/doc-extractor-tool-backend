import {
  ExtractedData,
  AccuracyTestResult,
  AccuracyMetric,
} from "../types/types";

export class AccuracyService {
  calculateAccuracy(
    extracted: ExtractedData,
    groundTruth: ExtractedData
  ): AccuracyTestResult {
    const goalAccuracy = this.compareGoals(
      extracted.goals || [],
      groundTruth.goals || []
    );
    const bmpAccuracy = this.compareBMPs(
      extracted.bmps || [],
      groundTruth.bmps || []
    );
    const implAccuracy = this.compareImplementation(
      extracted.implementation || [],
      groundTruth.implementation || []
    );
    const monitoringAccuracy = this.compareMonitoring(
      extracted.monitoring || [],
      groundTruth.monitoring || []
    );

    const overallPrecision =
      (goalAccuracy.precision +
        bmpAccuracy.precision +
        implAccuracy.precision +
        monitoringAccuracy.precision) /
      4;
    const overallRecall =
      (goalAccuracy.recall +
        bmpAccuracy.recall +
        implAccuracy.recall +
        monitoringAccuracy.recall) /
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
        goals: goalAccuracy,
        bmps: bmpAccuracy,
        implementation: implAccuracy,
        monitoring: monitoringAccuracy,
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
        this.fuzzyMatch(
          extractedBMP.name || extractedBMP.description,
          gt.name || gt.description
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
        this.fuzzyMatch(extractedImpl.activity, gt.activity)
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
        this.fuzzyMatch(extractedMon.parameter, gt.parameter)
      );
      if (match) correctCount++;
    }

    return this.calculateMetric(
      correctCount,
      extracted.length,
      groundTruth.length
    );
  }

  private fuzzyMatch(
    text1: string,
    text2: string,
    threshold: number = 0.7
  ): boolean {
    if (!text1 || !text2) return false;

    const clean1 = text1.toLowerCase().trim();
    const clean2 = text2.toLowerCase().trim();

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

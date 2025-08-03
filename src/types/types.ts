/**
 * API Response Interfaces for PDF Document Extractor
 * Matches frontend interfaces exactly for type safety
 */

// =============================================================================
// API Response Types (Backend Contract)
// =============================================================================

/**
 * PDF extraction result from backend processing
 */
export interface PdfExtractionResult {
  text: string;
  pages: number;
  textLength: number;
}

export interface UploadResponse {
  message: string;
  file: {
    filename: string;
    originalName: string;
    size: number;
  };
  extracted: PdfExtractionResult;
}

/**
 * Error response from backend
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Main extracted data structure from backend
 */
export interface ExtractedData {
  model?: string; // The AI model used for extraction
  goals?: Goal[];
  bmps?: BMP[];
  implementation?: ImplementationActivity[];
  monitoring?: MonitoringMetric[];
  outreach?: OutreachActivity[];
  geographicAreas?: GeographicArea[];
  contacts?: Contact[];
  organizations?: Organization[];
  reportSummary?: ReportSummary;
}

// =============================================================================
// Domain-Specific Interfaces (Agricultural/Environmental Reports)
// =============================================================================

/**
 * Summary of the watershed plan
 */
export interface ReportSummary {
  totalGoals: number;
  totalBMPs: number;
  completionRate: number | null;
}

/**
 * A watershed management goal or objective
 */
export interface Goal {
  id?: string;
  description: string;
  objective?: string;
  targetArea?: string;
  schedule?: string;
  contacts?: Contact[];
  desiredOutcomes?: string[] | null;
}

/**
 * Best Management Practice (BMP)
 */
export interface BMP {
  name: string;
  description?: string | null;
  type?: "Nutrient" | "Pathogen" | "Sediment" | string | null;
  targetAreas?: string[];
  quantity?: number | null;
  unit?: string | null; // e.g. "ft", "ac", "ea"
  estimatedCost?: number | null;
  partners?: Organization[];
  schedule?: string;
  priorityFactors?: string[] | null;
}

/**
 * Implementation activity or milestone
 */
export interface ImplementationActivity {
  description: string;
  responsibleParties?: Organization[];
  startDate?: string;
  endDate?: string;
  status?: string;
  outcome?: string;
  probableCompletionDate?: string;
}

/**
 * Monitoring metric, threshold, or method
 */
export interface MonitoringMetric {
  description: string;
  indicator?: string;
  method?: string;
  frequency?: string;
  thresholds?: Threshold[];
  responsibleParties?: Organization[];
  sampleLocations?: string[];
  sampleSchedule?: string;
}

/**
 * Numeric or narrative threshold for a monitored parameter
 */
export interface Threshold {
  parameter: string; // e.g., "Dissolved Oxygen"
  value: string | number;
  units?: string;
}

/**
 * Education/outreach event or program
 */
export interface OutreachActivity {
  name: string;
  description?: string;
  partners?: Organization[];
  indicators?: string;
  schedule?: string;
  budget?: number;
  events?: EventDetail[];
  targetAudience?: string;
}

/**
 * Detail for a single outreach event
 */
export interface EventDetail {
  type: string;
  audience?: string;
  materialsProvided?: string[];
  estimatedParticipants?: number;
  cost?: number;
  date?: string;
}

/**
 * Watershed, subwatershed, or area of interest
 */
export interface GeographicArea {
  name: string;
  counties?: string[] | null;
  acreage?: number | null;
  landUseTypes?: LandUseType[] | null;
  population?: number | null;
  towns?: string[] | null;
  huc?: string | null;
  description?: string;
}

/**
 * Land use type and percent
 */
export interface LandUseType {
  type: string; // e.g., "cropland"
  percent: number; // e.g., 11
}

/**
 * Contact for a person/team member/agency
 */
export interface Contact {
  name?: string | null;
  role?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Organization or agency involved
 */
export interface Organization {
  name: string;
  contact?: Contact;
}

// =============================================================================
// Accuracy Testing Types
// =============================================================================

/**
 * Result from accuracy testing
 */
export interface AccuracyTestResult {
  testCase: string;
  model?: string; // The AI model used for extraction
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  details: {
    goals: AccuracyMetric;
    bmps: AccuracyMetric;
    implementation: AccuracyMetric;
    monitoring: AccuracyMetric;
  };
  // DEBUG DATA - Compare expected vs actual
  comparison?: {
    expected: ExtractedData; // Ground truth data
    actual: ExtractedData; // AI extracted data
  };
  // DETAILED COMPARISONS - Show exactly what matched/didn't match
  detailedComparisons?: {
    goals: ComparisonDetail[];
    bmps: ComparisonDetail[];
    implementation: ComparisonDetail[];
    monitoring: ComparisonDetail[];
  };
}

/**
 * Detailed comparison for individual items
 */
export interface ComparisonDetail {
  type:
    | "perfect_match"
    | "partial_match"
    | "missing_expected"
    | "unexpected_extra";
  category: "goals" | "bmps" | "implementation" | "monitoring";
  expected?: string | null; // What we expected to find
  actual?: string | null; // What we actually found
  similarity?: number; // Similarity score (0-1) for partial matches
  message: string; // Human-readable explanation
}

/**
 * Accuracy metrics for a specific data type
 */
export interface AccuracyMetric {
  precision: number;
  recall: number;
  f1Score: number;
  correctCount: number;
  totalExtracted: number;
  totalExpected: number;
}

/**
 * Test case definition
 */
export interface TestCase {
  id: string;
  name: string;
  pdfPath: string;
  groundTruthPath: string;
  hasGroundTruth: boolean;
}

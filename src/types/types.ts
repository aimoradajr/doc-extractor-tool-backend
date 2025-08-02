// API Response Types
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

export interface ErrorResponse {
  error: string;
}

// Core interfaces for PDF extraction based on OpenAI analysis of 5 watershed PDFs
export interface ExtractedData {
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

// Summary of the watershed plan
export interface ReportSummary {
  totalGoals: number;
  totalBMPs: number;
  completionRate: number;
}

// A watershed management goal or objective
export interface Goal {
  id?: string;
  description: string;
  objective?: string;
  targetArea?: string;
  schedule?: string;
  contacts?: Contact[];
  desiredOutcomes?: string[];
}

// Best Management Practice (BMP)
export interface BMP {
  name: string;
  description?: string;
  type?: "Nutrient" | "Pathogen" | "Sediment" | string;
  targetAreas?: string[];
  quantity?: number;
  unit?: string; // e.g. "ft", "ac", "ea"
  estimatedCost?: number;
  partners?: Organization[];
  schedule?: string;
  priorityFactors?: string[];
}

// Implementation activity or milestone
export interface ImplementationActivity {
  description: string;
  responsibleParties?: Organization[];
  startDate?: string;
  endDate?: string;
  status?: string;
  outcome?: string;
  probableCompletionDate?: string;
}

// Monitoring metric, threshold, or method
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

// Numeric or narrative threshold for a monitored parameter
export interface Threshold {
  parameter: string; // e.g., "Dissolved Oxygen"
  value: string | number;
  units?: string;
}

// Education/outreach event or program
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

// Detail for a single outreach event
export interface EventDetail {
  type: string;
  audience?: string;
  materialsProvided?: string[];
  estimatedParticipants?: number;
  cost?: number;
  date?: string;
}

// Watershed, subwatershed, or area of interest
export interface GeographicArea {
  name: string;
  counties?: string[];
  acreage?: number;
  landUseTypes?: LandUseType[];
  population?: number;
  towns?: string[];
  huc?: string;
  description?: string;
}

// Land use type and percent
export interface LandUseType {
  type: string; // e.g., "cropland"
  percent: number; // e.g., 11
}

// Contact for a person/team member/agency
export interface Contact {
  name: string;
  role?: string;
  organization?: string;
  phone?: string;
  email?: string;
}

// Organization or agency involved
export interface Organization {
  name: string;
  contact?: Contact;
}

// Accuracy Testing Types
export interface AccuracyTestResult {
  testCase: string;
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
}

export interface AccuracyMetric {
  precision: number;
  recall: number;
  f1Score: number;
  correctCount: number;
  totalExtracted: number;
  totalExpected: number;
}

export interface TestCase {
  id: string;
  name: string;
  pdfPath: string;
  groundTruthPath: string;
  hasGroundTruth: boolean;
}

export interface AccuracyTestResult {
  testCase: string;
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
}

export interface AccuracyMetric {
  precision: number;
  recall: number;
  f1Score: number;
  correctCount: number;
  totalExtracted: number;
  totalExpected: number;
}

export interface TestCase {
  id: string;
  name: string;
  pdfPath: string;
  groundTruthPath: string;
  hasGroundTruth: boolean;
}

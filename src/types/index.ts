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

// Assessment-specific data structures
export interface ExtractedReport {
  summary: {
    totalGoals: number;
    totalBMPs: number;
    completionRate: number;
  };
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  targetDate?: string;
  metrics?: string[];
}

export interface BMP {
  id: string;
  name: string;
  description: string;
  category: string;
  implementation: string;
  costEstimate?: number;
  effectiveness?: string;
}

export interface ImplementationActivity {
  id: string;
  activity: string;
  responsible: string;
  timeline: string;
  status: "planned" | "in-progress" | "completed";
  relatedGoals: string[];
}

export interface MonitoringMetric {
  id: string;
  parameter: string;
  target: string;
  frequency: string;
  method: string;
  currentValue?: number;
}

export interface OutreachActivity {
  id: string;
  activity: string;
  audience: string;
  method: string;
  frequency: string;
  relatedGoals: string[];
}

export interface GeographicArea {
  id: string;
  name: string;
  type: "watershed" | "county" | "state" | "region";
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
}

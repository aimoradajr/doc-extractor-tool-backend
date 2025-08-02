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

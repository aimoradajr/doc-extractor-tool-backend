import { Request, Response } from "express";
import { pdfService } from "../services/pdfService";
import { UploadResponse, ErrorResponse, ExtractedData } from "../types/types";

export class UploadController {
  uploadPdf = async (
    req: Request,
    res: Response<UploadResponse | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractText(req.file!.path);

      res.json({
        message: "PDF processed successfully",
        file: {
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
        },
        extracted: result,
      });
    } catch (error) {
      console.error("PDF processing error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  };

  extractStructuredData = async (
    req: Request,
    res: Response<ExtractedData | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractStructuredData(req.file!.path);
      res.json(result);
    } catch (error) {
      console.error("Structured extraction error:", error);
      res.status(500).json({ error: "Failed to extract structured data" });
    }
  };

  extractStructuredData_WithResponsesAPI = async (
    req: Request,
    res: Response<ExtractedData | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractStructuredData_WithResponsesAPI(
        req.file!.path,
        false // Don't use direct file upload for extract2
      );
      res.json(result);
    } catch (error) {
      console.error("Structured extraction error (Responses API):", error);
      res.status(500).json({
        error: "Failed to extract structured data with Responses API",
      });
    }
  };

  extractStructuredData_WithDirectFileUpload = async (
    req: Request,
    res: Response<ExtractedData | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractStructuredData_WithResponsesAPI(
        req.file!.path,
        true // Use direct file upload
      );
      res.json(result);
    } catch (error) {
      console.error("Structured extraction error (Direct File Upload):", error);
      res.status(500).json({
        error: "Failed to extract structured data with direct file upload",
      });
    }
  };

  // NEW ROUTE USING PDF2JSON
  uploadPdf2 = async (
    req: Request,
    res: Response<UploadResponse | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractTextWithPdf2Json(req.file!.path);

      res.json({
        message: "PDF processed successfully with PDF2Json",
        file: {
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
        },
        extracted: result,
      });
    } catch (error) {
      console.error("PDF processing error (PDF2Json):", error);
      res.status(500).json({ error: "Failed to process PDF with PDF2Json" });
    }
  };
}

export const uploadController = new UploadController();

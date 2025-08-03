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

  // NEW ROUTE USING PDFREADER
  uploadPdf2 = async (
    req: Request,
    res: Response<UploadResponse | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractTextWithPdfReader(req.file!.path);

      res.json({
        message: "PDF processed successfully with PDFReader",
        file: {
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
        },
        extracted: result,
      });
    } catch (error) {
      console.error("PDF processing error (PDFReader):", error);
      res.status(500).json({ error: "Failed to process PDF with PDFReader" });
    }
  };
}

export const uploadController = new UploadController();

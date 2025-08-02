import { Request, Response } from "express";
import { pdfService } from "../services/pdfService";
import { UploadResponse, ErrorResponse, ExtractedReport } from "../types";

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
    res: Response<ExtractedReport | ErrorResponse>
  ) => {
    try {
      const result = await pdfService.extractStructuredData(req.file!.path);

      res.json(result);
    } catch (error) {
      console.error("Structured extraction error:", error);
      res.status(500).json({ error: "Failed to extract structured data" });
    }
  };
}

export const uploadController = new UploadController();

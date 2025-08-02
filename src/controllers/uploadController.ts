import { Request, Response } from "express";
import { pdfService } from "../services/pdfService";
import { UploadResponse, ErrorResponse } from "../types";

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
}

export const uploadController = new UploadController();

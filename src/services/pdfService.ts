import pdf from "pdf-parse";
import fs from "fs";
import { PdfExtractionResult } from "../types";

export class PdfService {
  async extractText(filePath: string): Promise<PdfExtractionResult> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    return {
      text: data.text,
      pages: data.numpages,
      textLength: data.text.length,
    };
  }

  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n+/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export const pdfService = new PdfService();

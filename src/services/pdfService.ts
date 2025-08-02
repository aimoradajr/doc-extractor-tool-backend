import fs from "fs";
import { PdfExtractionResult, ExtractedData } from "../types/types";
import { openAIService } from "./openAIService";

// Use require with type assertion for pdf-parse (no official types available)
const pdf = require("pdf-parse") as any;

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

  async extractStructuredData(filePath: string): Promise<ExtractedData> {
    // First extract raw text
    const textResult = await this.extractText(filePath);

    // Clean the text
    const cleanedText = this.cleanText(textResult.text);

    // Use OpenAI to extract structured data
    const structuredData = await openAIService.extractStructuredData(
      cleanedText
    );

    return structuredData;
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

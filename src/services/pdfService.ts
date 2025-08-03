import fs from "fs";
import { PdfExtractionResult, ExtractedData } from "../types/types";
import { openAIService } from "./openAIService";

// Use require with type assertion for pdf-parse (no official types available)
const pdf = require("pdf-parse") as any;
const pdfreader = require("pdfreader");

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

  async extractTextWithPdfReader(
    filePath: string
  ): Promise<PdfExtractionResult> {
    return new Promise((resolve, reject) => {
      let fullText = "";
      let pageCount = 0;

      new pdfreader.PdfReader().parseFileItems(
        filePath,
        (err: any, item: any) => {
          if (err) {
            reject(new Error(`PDFReader error: ${err.message}`));
            return;
          }

          if (!item) {
            // End of file
            resolve({
              text: fullText.trim(),
              pages: pageCount,
              textLength: fullText.trim().length,
            });
            return;
          }

          if (item.page) {
            pageCount = Math.max(pageCount, item.page);
            if (pageCount > 1) {
              fullText += `\n\n--- PAGE ${pageCount} ---\n\n`;
            }
          }

          if (item.text) {
            fullText += item.text;
          }
        }
      );
    });
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

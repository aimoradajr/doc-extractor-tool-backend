import fs from "fs";
import { PdfExtractionResult, ExtractedData } from "../types/types";
import { openAIService } from "./openAIService";

// Use require with type assertion for pdf-parse (no official types available)
const pdf = require("pdf-parse") as any;
const PDFParser = require("pdf2json");

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

  async extractTextWithPdf2Json(
    filePath: string
  ): Promise<PdfExtractionResult> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF2Json error: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          let fullText = "";
          let pageCount = 0;

          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            pageCount = pdfData.Pages.length;

            pdfData.Pages.forEach((page: any, pageIndex: number) => {
              if (pageIndex > 0) {
                fullText += `\n\n--- PAGE ${pageIndex + 1} ---\n\n`;
              }

              if (page.Texts && Array.isArray(page.Texts)) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    textItem.R.forEach((textRun: any) => {
                      if (textRun.T) {
                        // Decode URI component to get actual text
                        const decodedText = decodeURIComponent(textRun.T);
                        fullText += decodedText + " ";
                      }
                    });
                  }
                });
              }
            });
          }

          resolve({
            text: fullText.trim(),
            pages: pageCount,
            textLength: fullText.trim().length,
          });
        } catch (error) {
          reject(new Error(`Failed to process PDF data: ${error}`));
        }
      });

      pdfParser.loadPDF(filePath);
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

  async extractStructuredData_WithResponsesAPI(
    filePath: string,
    useDirectFileUpload: boolean = false
  ): Promise<ExtractedData> {
    if (useDirectFileUpload) {
      console.log("Using direct PDF file upload to OpenAI Responses API");
      // Use direct file upload to OpenAI
      const structuredData =
        await openAIService.extractStructuredData_WithResponsesAPI({
          filePath: filePath,
        });
      return structuredData;
    } else {
      console.log("Using text extraction with OpenAI Responses API");
      // First extract raw text (existing behavior)
      const textResult = await this.extractText(filePath);

      // Clean the text
      const cleanedText = this.cleanText(textResult.text);

      // Use OpenAI Responses API to extract structured data
      const structuredData =
        await openAIService.extractStructuredData_WithResponsesAPI(cleanedText);

      return structuredData;
    }
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

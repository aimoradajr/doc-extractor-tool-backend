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
      const pageItems: Array<{
        page: number;
        x: number;
        y: number;
        text: string;
        width?: number;
        height?: number;
      }> = [];
      let pageCount = 0;

      new pdfreader.PdfReader().parseFileItems(
        filePath,
        (err: any, item: any) => {
          if (err) {
            reject(new Error(`PDFReader error: ${err.message}`));
            return;
          }

          if (!item) {
            // End of file - process collected items to detect tables
            const formattedText =
              this.processItemsWithTableDetection(pageItems);
            resolve({
              text: formattedText,
              pages: pageCount,
              textLength: formattedText.length,
            });
            return;
          }

          if (item.page) {
            pageCount = Math.max(pageCount, item.page);
          }

          if (item.text && item.x !== undefined && item.y !== undefined) {
            // Store positioned text items
            pageItems.push({
              page: item.page || pageCount,
              x: item.x,
              y: item.y,
              text: item.text.trim(),
              width: item.width,
              height: item.height,
            });
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

  private processItemsWithTableDetection(
    items: Array<{
      page: number;
      x: number;
      y: number;
      text: string;
      width?: number;
      height?: number;
    }>
  ): string {
    const pages = new Map<number, typeof items>();

    // Group items by page
    items.forEach((item) => {
      if (!pages.has(item.page)) {
        pages.set(item.page, []);
      }
      pages.get(item.page)!.push(item);
    });

    let formattedText = "";

    // Process each page
    pages.forEach((pageItems, pageNum) => {
      if (pageNum > 1) {
        formattedText += `\n\n--- PAGE ${pageNum} ---\n\n`;
      }

      // Sort items by y-coordinate (top to bottom), then by x-coordinate (left to right)
      const sortedItems = pageItems.sort((a, b) => {
        const yDiff = Math.abs(a.y - b.y);
        if (yDiff < 2) {
          // Items on roughly the same line
          return a.x - b.x; // Sort left to right
        }
        return a.y - b.y; // Sort top to bottom
      });

      // Detect potential table structures
      const processedText = this.detectAndFormatTables(sortedItems);
      formattedText += processedText;
    });

    return formattedText;
  }

  private detectAndFormatTables(
    items: Array<{
      x: number;
      y: number;
      text: string;
      width?: number;
      height?: number;
    }>
  ): string {
    if (items.length === 0) return "";

    const rows = new Map<number, Array<{ x: number; text: string }>>();
    const Y_TOLERANCE = 3; // Pixels tolerance for same row detection

    // Group items into rows based on Y coordinate
    items.forEach((item) => {
      let rowY = item.y;
      let foundRow = false;

      // Check if this item belongs to an existing row
      for (const [existingY] of rows) {
        if (Math.abs(existingY - item.y) <= Y_TOLERANCE) {
          rowY = existingY;
          foundRow = true;
          break;
        }
      }

      if (!rows.has(rowY)) {
        rows.set(rowY, []);
      }

      rows.get(rowY)!.push({ x: item.x, text: item.text });
    });

    // Convert to sorted array of rows
    const sortedRows = Array.from(rows.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, rowItems]) => rowItems.sort((a, b) => a.x - b.x));

    // Detect if this looks like a table
    const isTable = this.looksLikeTable(sortedRows);

    if (isTable) {
      return this.formatAsTable(sortedRows);
    } else {
      return this.formatAsRegularText(sortedRows);
    }
  }

  private looksLikeTable(
    rows: Array<Array<{ x: number; text: string }>>
  ): boolean {
    if (rows.length < 2) return false;

    // Check if multiple rows have similar column structure
    const columnCounts = rows.map((row) => row.length);
    const avgColumns =
      columnCounts.reduce((a, b) => a + b) / columnCounts.length;

    // If most rows have 2+ columns and similar column counts, likely a table
    const multiColumnRows = columnCounts.filter((count) => count >= 2).length;
    const consistentStructure = columnCounts.filter(
      (count) => Math.abs(count - avgColumns) <= 1
    ).length;

    return (
      multiColumnRows >= Math.max(2, rows.length * 0.6) &&
      consistentStructure >= rows.length * 0.7
    );
  }

  private formatAsTable(
    rows: Array<Array<{ x: number; text: string }>>
  ): string {
    let tableText = "\n[TABLE START]\n";

    rows.forEach((row, index) => {
      if (index === 0) {
        // Mark first row as headers
        tableText += "HEADERS: ";
      } else {
        tableText += "ROW: ";
      }

      tableText += row.map((cell) => cell.text).join(" | ") + "\n";
    });

    tableText += "[TABLE END]\n\n";
    return tableText;
  }

  private formatAsRegularText(
    rows: Array<Array<{ x: number; text: string }>>
  ): string {
    return (
      rows.map((row) => row.map((cell) => cell.text).join(" ")).join("\n") +
      "\n\n"
    );
  }
}

export const pdfService = new PdfService();

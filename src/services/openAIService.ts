import OpenAI from "openai";
import { ExtractedData, AccuracyTestResult } from "../types/types";

// EASY MODEL SWITCHING - Just change this line!
// const CURRENT_MODEL = "gpt-3.5-turbo"; // or "gpt-4"
const CURRENT_MODEL = "gpt-4.1"; // Use gpt-4 for better accuracy

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Using ${CURRENT_MODEL} model`);
  }

  async compareWithAI(
    extracted: ExtractedData,
    groundTruth: ExtractedData,
    model: string = "gpt-3.5-turbo"
  ): Promise<AccuracyTestResult> {
    try {
      const prompt = this.buildComparisonPrompt(extracted, groundTruth);

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at comparing extracted data from watershed management documents. Analyze the quality and accuracy of extracted data against ground truth. Return ONLY valid JSON without any markdown formatting or code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000, // Increased for detailed comparison responses
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI for comparison");
      }

      // Check if the response was truncated
      const finishReason = response.choices[0]?.finish_reason;
      if (finishReason === "length") {
        console.warn(
          "AI response was truncated due to token limit. Consider increasing max_tokens."
        );
      }

      // Clean the response by removing markdown code blocks
      const cleanedContent = this.cleanJsonFromMarkdown(content);

      try {
        const comparisonResult = JSON.parse(cleanedContent);

        // Ensure the result matches our expected format
        return {
          testCase: "ai-comparison",
          compare_ai_model: model,
          metrics: comparisonResult.metrics || {
            precision: 0,
            recall: 0,
            f1Score: 0,
          },
          details: comparisonResult.details || {
            goals: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
            bmps: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
            implementation: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
            monitoring: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
            outreach: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
            geographicAreas: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: 0,
              totalExpected: 0,
            },
          },
          comparison: {
            expected: groundTruth,
            actual: extracted,
          },
          detailedComparisons: comparisonResult.detailedComparisons || {
            goals: [],
            bmps: [],
            implementation: [],
            monitoring: [],
            outreach: [],
            geographicAreas: [],
          },
        };
      } catch (parseError) {
        const errorDetails = {
          operation: "COMPARISON",
          model: model,
          error:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
          originalContentLength: content.length,
          originalContentPreview: content.substring(0, 500),
          cleanedContentPreview: cleanedContent.substring(0, 500),
          finishReason: response.choices[0]?.finish_reason,
          truncated: response.choices[0]?.finish_reason === "length",
        };

        console.error(
          "COMPARISON AI FAILED - JSON parsing error:",
          errorDetails
        );
        console.warn(
          "Falling back to simplified comparison due to parsing error"
        );

        // Fallback: Return a simplified response when parsing fails
        return {
          testCase: "ai-comparison-fallback",
          compare_ai_model: model,
          metrics: {
            precision: 0,
            recall: 0,
            f1Score: 0,
          },
          details: {
            goals: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.goals?.length || 0,
              totalExpected: groundTruth.goals?.length || 0,
            },
            bmps: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.bmps?.length || 0,
              totalExpected: groundTruth.bmps?.length || 0,
            },
            implementation: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.implementation?.length || 0,
              totalExpected: groundTruth.implementation?.length || 0,
            },
            monitoring: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.monitoring?.length || 0,
              totalExpected: groundTruth.monitoring?.length || 0,
            },
            outreach: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.outreach?.length || 0,
              totalExpected: groundTruth.outreach?.length || 0,
            },
            geographicAreas: {
              precision: 0,
              recall: 0,
              f1Score: 0,
              correctCount: 0,
              totalExtracted: extracted.geographicAreas?.length || 0,
              totalExpected: groundTruth.geographicAreas?.length || 0,
            },
          },
          comparison: {
            expected: groundTruth,
            actual: extracted,
          },
          detailedComparisons: {
            goals: [
              {
                type: "surplus_actual",
                category: "goals",
                expected: null,
                actual: "COMPARISON AI failed - see logs",
                message: `COMPARISON AI JSON parsing failed (${model}): ${
                  errorDetails.error
                }. Response ${
                  errorDetails.truncated
                    ? "was truncated"
                    : "appears incomplete"
                }.`,
              },
            ],
            bmps: [],
            implementation: [],
            monitoring: [],
            outreach: [],
            geographicAreas: [],
          },
        };
      }
    } catch (error) {
      console.error(`COMPARISON AI failed with ${model}:`, error);
      throw new Error(`COMPARISON AI failed (${model}): ${error}`);
    }
  }

  async extractStructuredData(text: string): Promise<ExtractedData> {
    try {
      const prompt = this.buildExtractionPrompt(text);

      // Enhanced configuration for GPT-4.1 to ensure JSON output
      const requestConfig: any = {
        model: CURRENT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at extracting structured information from environmental and agricultural watershed management documents. You MUST return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the JSON in ```json or ``` blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 16000, // Increased to handle larger documents and complete JSON responses
      };

      // For GPT-4 models, use response_format to force JSON output
      if (CURRENT_MODEL.includes("gpt-4")) {
        requestConfig.response_format = { type: "json_object" };
      }

      const response = await this.openai.chat.completions.create(requestConfig);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Clean the response by removing markdown code blocks (fallback safety)
      const cleanedContent = this.cleanJsonFromMarkdown(content);

      try {
        const extractedData = JSON.parse(cleanedContent);
        const structuredData = this.validateAndStructureData(extractedData);

        // Add the model information to the response
        structuredData.model = CURRENT_MODEL;

        return structuredData;
      } catch (parseError) {
        const errorDetails = {
          operation: "DATA_EXTRACTION",
          model: CURRENT_MODEL,
          error:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
          originalContentLength: content.length,
          originalContentPreview: content.substring(0, 500),
          cleanedContentPreview: cleanedContent.substring(0, 500),
          finishReason: response.choices[0]?.finish_reason,
          truncated: response.choices[0]?.finish_reason === "length",
        };

        console.error(
          "EXTRACTION AI FAILED - JSON parsing error:",
          errorDetails
        );

        throw new Error(
          `EXTRACTION AI JSON parsing failed (${CURRENT_MODEL}): ${parseError}. ` +
            `Response ${
              errorDetails.truncated ? "was truncated" : "appears incomplete"
            }. ` +
            `Content length: ${errorDetails.originalContentLength} chars. ` +
            `Preview: ${errorDetails.cleanedContentPreview}...`
        );
      }
    } catch (error) {
      console.error(`EXTRACTION AI failed with ${CURRENT_MODEL}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(
        `EXTRACTION AI failed (${CURRENT_MODEL}): ${errorMessage}`
      );
    }
  }

  async extractStructuredData_WithResponsesAPI(
    input: string | { filePath: string }
  ): Promise<ExtractedData> {
    try {
      let responseConfig: any;

      // prompt presets
      const promptId = "pmpt_688f1bd9609c8196a4047f87ee2884dd00afa5e2eb852274"; // comment out to return to pass prompt
      const promptVersion = "6";

      if (promptId) {
        // Use pre-created prompt from OpenAI Playground
        console.log(
          `***Using prompt ID: ${promptId} (version: ${
            promptVersion || "latest"
          })`
        );

        if (typeof input === "string") {
          // Text-based extraction with prompt ID
          responseConfig = {
            prompt: {
              id: promptId,
              version: promptVersion || undefined,
            },
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: input,
                  },
                ],
              },
            ],
          };
        } else {
          // File-based extraction with prompt ID
          console.log(
            "***Uploading PDF file to OpenAI for direct processing..."
          );

          // Upload the PDF file to OpenAI
          const file = await this.openai.files.create({
            file: require("fs").createReadStream(input.filePath),
            purpose: "user_data",
          });

          console.log(`File uploaded with ID: ${file.id}`);

          responseConfig = {
            prompt: {
              id: promptId,
              version: promptVersion || undefined,
            },
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_file",
                    file_id: file.id,
                  },
                ],
              },
            ],
          };
        }
      } else {
        // Use inline prompts (existing functionality)
        let responseInput: any[];

        if (typeof input === "string") {
          // Text-based extraction (existing functionality)
          const prompt = this.buildExtractionPrompt(input);
          responseInput = [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: "You are an expert at extracting structured information from environmental and agricultural watershed management documents. You MUST return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the JSON in ```json or ``` blocks.",
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt,
                },
              ],
            },
          ];
        } else {
          // File-based extraction (new functionality)
          console.log(
            "***Uploading PDF file to OpenAI for direct processing..."
          );

          // Upload the PDF file to OpenAI
          const file = await this.openai.files.create({
            file: require("fs").createReadStream(input.filePath),
            purpose: "user_data",
          });

          console.log(`File uploaded with ID: ${file.id}`);

          // Create the prompt for file-based extraction
          const filePrompt = this.buildExtractionPromptForFile();

          responseInput = [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: "You are an expert at extracting structured information from environmental and agricultural watershed management documents. You MUST return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the JSON in ```json or ``` blocks.",
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  file_id: file.id,
                },
                {
                  type: "input_text",
                  text: filePrompt,
                },
              ],
            },
          ];
        }

        responseConfig = {
          model: CURRENT_MODEL,
          input: responseInput,
        };
      }

      // Use the OpenAI Responses API
      const response = await this.openai.responses.create(responseConfig);

      const content = response.output_text;
      if (!content) {
        throw new Error("No content received from OpenAI Responses API");
      }

      // Clean the response by removing markdown code blocks (fallback safety)
      const cleanedContent = this.cleanJsonFromMarkdown(content);

      try {
        const extractedData = JSON.parse(cleanedContent);
        const structuredData = this.validateAndStructureData(extractedData);

        // Add the model information to the response
        const inputType = typeof input === "string" ? "text" : "file";
        structuredData.model = `${CURRENT_MODEL} (Responses API - ${inputType} input)`;

        return structuredData;
      } catch (parseError) {
        const errorDetails = {
          operation: "DATA_EXTRACTION_RESPONSES",
          model: CURRENT_MODEL,
          inputType: typeof input === "string" ? "text" : "file",
          error:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
          originalContentLength: content.length,
          originalContentPreview: content.substring(0, 500),
          cleanedContentPreview: cleanedContent.substring(0, 500),
        };

        console.error(
          "EXTRACTION AI FAILED (Responses API) - JSON parsing error:",
          errorDetails
        );

        throw new Error(
          `EXTRACTION AI JSON parsing failed (${CURRENT_MODEL} Responses API): ${parseError}. ` +
            `Response appears incomplete. ` +
            `Content length: ${errorDetails.originalContentLength} chars. ` +
            `Preview: ${errorDetails.cleanedContentPreview}...`
        );
      }
    } catch (error) {
      console.error(
        `EXTRACTION AI failed with ${CURRENT_MODEL} (Responses API):`,
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(
        `EXTRACTION AI failed (${CURRENT_MODEL} Responses API): ${errorMessage}`
      );
    }
  }

  private buildExtractionPrompt(text: string): string {
    // TODO: provide a way to attach optionally a series of prompts to further enhance result. this will of course take more token but for the sake of increasing accuracy, it may be beneficial. something like a flag to 'attachEnhancementPrompts'

    // if text is more that max length,
    const maxlen = 100000;
    if (text.length > maxlen) {
      console.log(
        `------Input text exceeds maximum length of ${maxlen} characters. Actual length ${text.length}`
      );
    }

    return `
Extract structured information from this watershed management document. Return ONLY valid JSON in the exact format specified below.

IMPORTANT: If any property has a value of null, do not include that property in the output at all. Only return properties that have a real value. Do not return properties with null values anywhere in the output JSON.

Document text:
<<<PDF_START>>>
${text.substring(0, maxlen)}
<<<PDF_END>>>

Note: The input text is extracted from parsed PDFs, so tables and structured data may not appear in obvious table format. Please carefully analyze the text to identify information that likely originated from tables, such as repeated patterns, grouped short phrases, or sequences following headers like "Milestone," "Outcome," or "Date." Extract goals from these table-like structures as well, even if the table formatting is lost.

${this.getExtractionInstructions()}
`;
  }

  private buildExtractionPromptForFile(): string {
    return `
Extract structured information from this watershed management document (PDF file). Return ONLY valid JSON in the exact format specified below.

IMPORTANT: If any property has a value of null, do not include that property in the output at all. Only return properties that have a real value. Do not return properties with null values anywhere in the output JSON.

Note: You have direct access to the original PDF document, so you can see the actual formatting, tables, figures, and structure. Use this advantage to extract information more accurately than text-only extraction.

${this.getExtractionInstructions()}
`;
  }

  private getExtractionInstructions(): string {
    return `
General Hints:
   - Watershed management documents often use structured headings with "Element" prefixes (e.g., "Element A:", "Element F: Implementation Schedule", "Element C: Goals and Objectives"). Pay special attention to these sections as they typically contain key information for extraction.
   - Look for document metadata on the cover page, title page, headers, footers, and introductory sections:
     * Watershed name is often in the title or early sections
     * Plan title appears on cover page or document header
     * Publication dates may be on cover, title page, or in document properties
     * Author names and organizations are typically on cover page, title page, or acknowledgments
     * Geographic region is usually specified in title, introduction, or project area descriptions

IMPORTANT INSTRUCTIONS:
1. First, extract key document metadata:
   - summary: Write a brief 1-3 sentence summary of the entire watershed plan document describing what it is for, the main watershed/area covered, and the general purpose or objectives
   - watershedName: Extract the primary watershed name (e.g., "Basket Creek-Hickahala Creek Watershed")
   - planTitle: Extract the full document title as it appears on the cover or header
   - planDate: Extract the publication date, completion date, or plan year (format as YYYY, YYYY-MM, or YYYY-MM-DD)
   - authors: Extract individual author names if explicitly listed
   - organizations: Extract all organizations involved in creating/publishing the plan
   - geographicRegion: Extract the geographic coverage (e.g., "Tate County, Mississippi" or "Northwest Arkansas")
2. Extract all information into the appropriate arrays next
3. THEN calculate reportSummary counts based on what you extracted:
   - totalGoals = exact count of items in "goals" array
   - totalBMPs = exact count of items in "bmps" array  
   - completionRate = count of "completed" status items / total implementation items (0 if no implementation items)
4. Double-check that your reportSummary numbers match your array lengths
5. Do NOT use null for counts - use actual numbers (0 if empty)
6. CRITICAL - Extract ALL quantitative data accurately:
   - Look for numbers with units (acres, feet, dollars, percentages, etc.)
   - Extract cost estimates, quantities, target values, thresholds
   - Include specific dates, timelines, and numeric goals
   - If a number is mentioned, capture both the value and unit

6. 'GOAL' EXTRACTION RULES:
   - A goal is any major intended goal that is explicitly stated in the watershed plan as something to be achieved, established, or completed. This includes environmental targets, project milestones, management steps, and outreach/education achievements.
   - Only extract goals that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create goals that are not directly described or labeled in the text.
   - Goals may be found in narrative text, bullet lists, or tables under sections like "Goals," "Objectives," or similar headings.
   - HINTS for finding goals:
     * Look for section headers or table titles containing the word "Goal" or "Objectives" (e.g., "Project Goals," "Watershed Goals," "Objectives," or "Goal Statement")—these sections usually state what the plan aims to achieve
     * Look for clear, concise statements in introductory or summary sections that describe desired outcomes or targets (e.g., "The goal of this plan is to reduce sediment loading by 40%," or "Objectives include improving water quality and increasing community awareness")
   - Use the exact language from the document when possible. Paraphrase only for clarity if the goal is split across sentences, but do not invent new goals.
   - CRITICAL: For each goal extracted, include a brief excerpt (approximately 10 words) from the document where you found this goal. This should be the key phrase or sentence that contains the goal statement.

7. 'BMP' EXTRACTION RULES:
   - A BMP (Best Management Practice) is any specific action, measure, or practice described in the watershed plan to reduce pollution, manage water, or protect resources. This can include physical structures, management techniques, or operational practices.
   - Only extract BMPs that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create BMPs that are not directly described or labeled in the text.
   - BMPs may be found in narrative text, bullet lists, or tables under sections like "Best Management Practices," "Management Measures," "Proposed Actions," or similar headings.
   - HINTS for finding BMPs:
     * Look for section headers or table titles containing "Best Management Practices," "BMPs," or "Management Measures"—these sections almost always list the specific practices recommended for the watershed
     * Look for bulleted or numbered lists under "BMP" or "Management Measures" sections—these lists typically describe the individual practices (e.g., cover crops, fencing, buffer strips) that are considered BMPs
   - Use the exact language from the document when possible. Paraphrase only for clarity if the BMP is split across sentences, but do not invent new BMPs.
   - CRITICAL: For each BMP extracted, include a brief excerpt (about 10 words) from the document where you found this BMP. This should be the key phrase or sentence that contains the BMP statement.

8. 'IMPLEMENTATION' (ACTIVITIES) EXTRACTION RULES:
   - An implementation is any concrete action, step, or scheduled activity described in the watershed plan for putting goals or BMPs into practice. This includes project management steps, outreach efforts, monitoring, reporting, or any tasks with assigned timing or responsibility.
   - Only extract implementations that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create implementations that are not directly described or labeled in the text.
   - Implementations may be found in narrative text, bullet lists, timelines, tables, or under sections like "Implementation Schedule," "Milestones," "Action Plan," or similar headings.
   - HINTS for finding implementations:
     * Look for section headers or table titles containing the word "Implementation" (e.g., "Implementation Schedule," "Implementation Activities," "Implementation Plan")
     * Look for bulleted or numbered lists under "Implementation" sections—these lists almost always describe the specific actions or steps to be carried out
     * Look for action-oriented language with specific verbs: "install," "construct," "develop," "establish," "conduct," "monitor," "report," "coordinate," "maintain"
     * Look for activities with timing/scheduling information: "by 2025," "within 6 months," "annually," "quarterly," "Phase 1," "Year 1-3"
     * Look for activities with assigned responsibility: "NRCS will," "County to," "Landowner responsible for," "Contractor shall"
     * Look for Element _ sections (common in 9-Element plans) as they typically contain implementation schedules
     * Look for tables with columns like "Activity," "Timeline," "Responsible Party," "Status," "Milestone"
   - Use the exact language from the document when possible. Paraphrase only for clarity if the implementation is split across sentences, but do not invent new implementations.
   - CRITICAL: For each implementation extracted, include a brief excerpt (about 10 words) from the document where you found this implementation. This should be the key phrase or sentence that contains the implementation statement.

9. 'MONITORING' (METRICS) EXTRACTION RULES:
   - IMPORTANT DISTINCTION: Extract only monitoring metrics, NOT monitoring activities.
     * Monitoring activities are broad actions (e.g., "conduct water quality sampling," "monitor stream conditions")
     * Monitoring metrics are specific, measurable parameters or indicators (e.g., "Total Suspended Solids concentration in mg/L sampled monthly at Site 3")
   - Extract only monitoring metrics: specific, measurable indicators, parameters, or thresholds described in the watershed plan for tracking progress, effectiveness, or compliance of goals or BMPs.
   - These should specify what is being measured (e.g., nutrient concentration, biological index), how it's measured (method or protocol), how often (frequency or schedule), and who is responsible.
   - Only extract monitoring metrics that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create monitoring metrics that are not directly described or labeled in the text.
   - HINTS for finding monitoring metrics:
     * Look for tables or text describing parameters, indicators, or methods used in monitoring (e.g., "phosphorus concentration," "biological index," "sampling protocol")
     * Look for sections or lists that specify thresholds, frequencies, or sample locations for monitoring
     * Look for mention of "monitoring metric," "indicator," "parameter," "threshold," or "criteria"
     * Look for specific measurable values with units and measurement details (e.g., "Total Suspended Solids concentration in mg/L sampled monthly at Site 3")
     * Look for structured, quantifiable elements rather than general monitoring descriptions
     * Focus on the MonitoringMetric interface: what's measured, how it's measured, frequency, thresholds, locations
   - Use the exact language from the document when possible. Paraphrase only for clarity if the monitoring metric is split across sentences, but do not invent new monitoring metrics.
   - CRITICAL: For each monitoring metric extracted, include a brief excerpt (about 10 words) from the document where you found this monitoring metric. This should be the key phrase or sentence that contains the metric description.

10. OUTREACH ACTIVITY EXTRACTION RULES:
   - An outreach activity is any concrete action, step, or scheduled effort described in the watershed plan for engaging, educating, or communicating with stakeholders, landowners, the public, or specific groups. This includes workshops, technical assistance, meetings, educational campaigns, communications materials, or events with assigned timing or responsibility.
   - Only extract outreach activities that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create outreach actions that are not directly described or labeled in the text.
   - Outreach activities may be found in narrative text, bullet lists, timelines, tables, or under sections like "Outreach," "Education," "Public Involvement," "Technical Assistance," "Stakeholder Engagement," or similar headings.
   - HINTS for finding outreach activities:
     * Look for section headers or table titles containing words like "Outreach," "Education," "Public Involvement," "Technical Assistance," "Stakeholder Engagement," or similar
     * Look for bulleted or numbered lists under these sections—these often detail specific outreach steps, events, or materials
     * Look for action-oriented language with verbs such as: "educate," "inform," "engage," "assist," "train," "hold meetings," "conduct workshops," "provide materials," "coordinate," "contact"
     * Look for activities with timing or scheduling information: "quarterly workshops," "annual field days," "by 2026," "during Phase 2"
     * Look for activities with assigned responsibility: "Extension will lead...," "NRCS to provide...," "Project coordinator will organize..."
     * Look for tables with columns like "Outreach Activity," "Timeline," "Responsible Party," "Audience," "Status"
   - Use the exact language from the document when possible. Paraphrase only for clarity if the outreach activity is split across sentences, but do not invent new outreach items.
   - CRITICAL: For each outreach activity extracted, include a brief excerpt (about 10 words) from the document where you found this outreach statement. This should be the key phrase or sentence that contains the outreach description.

11. 'WRIAs/GEOGRAPHIC AREAS' EXTRACTION RULES:
   - A WRIA (Water Resource Inventory Area) or geographic area is any explicitly defined spatial unit, boundary, or region described in the watershed plan for the purposes of water resource management, planning, monitoring, or reporting. This includes WRIAs, HUCs (Hydrologic Unit Codes), named watersheds, sub-watersheds, basins, catchments, and specific project areas.
   - Only extract WRIAs or geographic areas that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create areas that are not directly described or labeled in the text.
   - WRIAs or geographic areas may be found in narrative text, bullet lists, tables, maps, figure captions, or under sections such as "Geographic Area," "Watershed Description," "Project Area," "HUC," or similar headings.
   - HINTS for finding WRIAs/geographic areas:
     * Look for section headers, table titles, or map legends containing words like "WRIA," "Watershed," "HUC," "Subwatershed," "Basin," "Catchment," "Project Area," "Drainage Area," or similar
     * Look for explicit mention of codes or names, such as "WRIA 9," "HUC 080302040403," "Basket Creek-Hickahala Creek Watershed," or "James-Wolf Creek sub-basin"
     * Look for geographic identifiers (numbers or names) used for planning, monitoring, or reporting (e.g., "this plan covers HUC 080302040403")
     * Look for references to boundaries, extents, maps, or figures that define spatial coverage, such as "see Figure 2 for project area"
     * Look for tables or lists with columns like "Geographic Area," "HUC," "WRIA," "Watershed," or "Project Area"
   - Use the exact language, codes, and names from the document when possible. Paraphrase only for clarity if the area is described across sentences, but do not invent new areas.
   - CRITICAL: For each WRIA or geographic area extracted, include a brief excerpt (about 10 words) from the document where you found this area. This should be the key phrase or sentence that contains the area or code.

Required JSON format:
{
  "reportSummary": {
    "summary": "Brief 1-3 sentence description of the watershed plan, its purpose, and coverage area",
    "watershedName": "Primary watershed name from the document",
    "planTitle": "Full document title as it appears",
    "planDate": "YYYY or YYYY-MM or YYYY-MM-DD or null if not found",
    "authors": ["Author Name 1", "Author Name 2"],
    "organizations": ["Organization 1", "Organization 2"],
    "geographicRegion": "Geographic coverage area (county, state, region)",
    "totalGoals": number,
    "totalBMPs": number,
    "completionRate": number_between_0_and_1
  },
  "goals": [
    {
      "description": "goal description",
      "schedule": "timeline or schedule",
      "sourceExcerpt": "exact text from document where this goal was found"
    }
  ],
  "bmps": [
    {
      "name": "BMP name",
      "description": "BMP description",
      "type": "Nutrient|Pathogen|Sediment|other",
      "targetAreas": ["area1", "area2"],
      "quantity": number_or_null,
      "unit": "ft|ac|ea|other",
      "estimatedCost": number_or_null,
      "schedule": "implementation schedule",
      "sourceExcerpt": "exact text from document where this BMP was found"
    }
  ],
  "implementation": [
    {
      "description": "activity description",
      "responsibleParties": [{"name": "organization"}],
      "status": "status (e.g., 'completed', 'in progress', 'planned')",
      "sourceExcerpt": "exact text from document where this implementation was found"
    }
  ],
  "monitoring": [
    {
      "parameter": "what is being measured (e.g., 'Total Suspended Solids', 'M-BISQ')",
      "type": "type of monitoring (e.g., 'chemical', 'biological', 'physical')",
      "method": "monitoring method",
      "frequency": "how often",
      "thresholds": [{"parameter": "param name", "description": ">= 5 mg/L (daily avg), >= 4 mg/L (instantaneous)"}],
      "locations": ["location1", "location2"],
      "sourceExcerpt": "exact text from document where this monitoring was found"
    }
  ],
  "outreach": [
    {
      "type": "activity category (e.g., 'signage', 'field day', 'mailer')",
      "description": "activity description",
      "schedule": "activity schedule",
      "indicator": "success indicators",
      "partners": ["partner1", "partner2"],
      "sourceExcerpt": "exact text from document where this outreach was found"
    }
  ],
  "geographicAreas": [
    {
      "huc": "HUC code (e.g. '031601060307')",
      "watershedName": "watershed name (e.g. 'Broken Pumpkin Creek Watershed')",
      "counties": ["county1", "county2"],
      "state": "state name (e.g. 'Mississippi')",
      "sourceExcerpt": "exact text from document where this geographic area was found"
    }
  ],
  "contacts": [
    {
      "name": "contact name",
      "role": "their role",
      "organization": "their organization",
      "phone": "phone number",
      "email": "email address"
    }
  ],
  "organizations": [
    {
      "name": "organization name",
      "contact": {"name": "contact person", "role": "role"}
    }
  ]
}

CRITICAL: 
- Start by extracting key document metadata (summary, watershed name, title, date, authors, organizations, geographic region)
- Look for metadata on cover pages, title pages, headers, footers, and introductory sections
- Extract only information explicitly stated in the document
- Do not infer or make up data  
- If a metadata field is not found, use appropriate fallback (null for dates, empty arrays for lists, descriptive text for missing fields)
- ALWAYS calculate reportSummary counts accurately based on your extracted arrays
- Verify: summary should describe the plan's purpose and coverage area
- Verify: watershedName should be the primary watershed from the document
- Verify: totalGoals should equal the number of items in your "goals" array
- Verify: totalBMPs should equal the number of items in your "bmps" array
- Use 0 instead of null for counts when arrays are empty

RESPONSE FORMAT:
- Return ONLY valid JSON
- Do NOT use markdown code blocks
- Do NOT add any explanatory text before or after the JSON
- Start your response directly with the opening { brace
- End your response with the closing } brace
`;
  }

  private buildComparisonPrompt(
    extracted: ExtractedData,
    groundTruth: ExtractedData
  ): string {
    // Summarize data to reduce token usage for large documents
    const summarizedExtracted = this.summarizeDataForComparison(extracted);
    const summarizedGroundTruth = this.summarizeDataForComparison(groundTruth);

    return `
Compare the extracted watershed management data against the ground truth data and provide accuracy metrics.

EXTRACTED DATA:
${JSON.stringify(summarizedExtracted, null, 2)}

GROUND TRUTH DATA:
${JSON.stringify(summarizedGroundTruth, null, 2)}

Please analyze the accuracy by comparing:
1. Goals - Check how well the extracted goals match the expected goals
2. BMPs - Compare extracted BMPs against ground truth BMPs  
3. Implementation - Compare implementation activities
4. Monitoring - Compare monitoring metrics
5. Outreach - Compare outreach activities
6. Geographic Areas - Compare geographic areas, WRIAs, HUCs, and spatial boundaries

Return a JSON response in this exact format:
{
  "metrics": {
    "precision": number_between_0_and_1,
    "recall": number_between_0_and_1,
    "f1Score": number_between_0_and_1
  },
  "details": {
    "goals": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    },
    "bmps": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    },
    "implementation": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    },
    "monitoring": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    },
    "outreach": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    },
    "geographicAreas": {
      "precision": number_between_0_and_1,
      "recall": number_between_0_and_1,
      "f1Score": number_between_0_and_1,
      "correctCount": number,
      "totalExtracted": number,
      "totalExpected": number
    }
  },
  "detailedComparisons": {
    "goals": [
      {
        "type": "perfect_match|partial_match|missing_expected|surplus_actual",
        "category": "goals",
        "expected": "expected text or null",
        "actual": "actual text or null",
        "message": "brief explanation"
      }
    ],
    "bmps": [{"type": "...", "category": "bmps", "expected": "...", "actual": "...", "message": "..."}],
    "implementation": [{"type": "...", "category": "implementation", "expected": "...", "actual": "...", "message": "..."}],
    "monitoring": [{"type": "...", "category": "monitoring", "expected": "...", "actual": "...", "message": "..."}],
    "outreach": [{"type": "...", "category": "outreach", "expected": "...", "actual": "...", "message": "..."}],
    "geographicAreas": [{"type": "...", "category": "geographicAreas", "expected": "...", "actual": "...", "message": "..."}]
  }
}

INSTRUCTIONS:
- Use semantic similarity to match items, not just exact text matching
- Consider partial matches when content is similar but not identical
- Keep messages brief and focused (max 50 words each)
- Calculate precision as: correctCount / totalExtracted
- Calculate recall as: correctCount / totalExpected  
- Calculate F1 as: 2 * (precision * recall) / (precision + recall)
- Be thorough but concise in your comparison

CRITICAL: Return ONLY the JSON response. Do not wrap it in markdown code blocks or add any other text.
`;
  }

  private validateAndStructureData(data: any): ExtractedData {
    // Trust the AI to calculate reportSummary correctly with improved prompt
    // Only provide fallbacks if reportSummary is completely missing
    return {
      model: CURRENT_MODEL, // Will be overridden by caller
      reportSummary: data.reportSummary || {
        summary: data.reportSummary?.summary || "Summary not provided",
        watershedName:
          data.reportSummary?.watershedName || "Watershed name not found",
        planTitle: data.reportSummary?.planTitle || "Plan title not found",
        planDate: data.reportSummary?.planDate || null,
        authors: data.reportSummary?.authors || [],
        organizations: data.reportSummary?.organizations || [],
        geographicRegion:
          data.reportSummary?.geographicRegion ||
          "Geographic region not specified",
        totalGoals: data.goals?.length || 0,
        totalBMPs: data.bmps?.length || 0,
        completionRate: this.calculateCompletionRate(data.implementation || []),
      },
      goals: data.goals || [],
      bmps: data.bmps || [],
      implementation: data.implementation || [],
      monitoring: data.monitoring || [],
      outreach: data.outreach || [],
      geographicAreas: data.geographicAreas || [],
      contacts: data.contacts || [],
      organizations: data.organizations || [],
    };
  }

  private summarizeDataForComparison(data: ExtractedData): any {
    // Limit the size of data sent to AI to avoid token limits
    return {
      goals: (data.goals || []).slice(0, 10).map((goal) => ({
        description: goal.description?.substring(0, 200) || "",
      })),
      bmps: (data.bmps || []).slice(0, 10).map((bmp) => ({
        name: bmp.name?.substring(0, 100) || "",
        description: bmp.description?.substring(0, 200) || "",
      })),
      implementation: (data.implementation || []).slice(0, 10).map((impl) => ({
        description: impl.description?.substring(0, 200) || "",
      })),
      monitoring: (data.monitoring || []).slice(0, 10).map((mon) => ({
        parameter: mon.parameter?.substring(0, 200) || "",
      })),
      outreach: (data.outreach || []).slice(0, 10).map((outreach) => ({
        type: outreach.type?.substring(0, 100) || "",
        description: outreach.description?.substring(0, 200) || "",
      })),
      geographicAreas: (data.geographicAreas || [])
        .slice(0, 10)
        .map((area) => ({
          watershedName: area.watershedName?.substring(0, 100) || "",
          huc: area.huc || "",
          state: area.state || "",
        })),
    };
  }

  private cleanJsonFromMarkdown(content: string): string {
    // Remove markdown code blocks like ```json and ```
    let cleaned = content.trim();

    // Remove opening markdown code block
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }

    // Remove closing markdown code block
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    // Check if JSON appears to be truncated (incomplete)
    const trimmed = cleaned.trim();
    if (trimmed.startsWith("{") && !trimmed.endsWith("}")) {
      console.warn(
        "JSON response appears to be truncated - missing closing brace"
      );
    }

    return trimmed;
  }

  private calculateCompletionRate(implementation: any[]): number {
    if (implementation.length === 0) return 0;

    const completed = implementation.filter(
      (item) => item.status === "completed"
    ).length;
    return completed / implementation.length;
  }
}

// Create and export a simple service instance
export const openAIService = new OpenAIService();

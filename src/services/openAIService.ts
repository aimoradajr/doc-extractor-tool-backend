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
          model: model,
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
          },
        };
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:");
        console.error("Original content:", content.substring(0, 500) + "...");
        console.error(
          "Cleaned content:",
          cleanedContent.substring(0, 500) + "..."
        );
        console.warn(
          "Falling back to simplified comparison due to parsing error"
        );

        // Fallback: Return a simplified response when parsing fails
        return {
          testCase: "ai-comparison-fallback",
          model: model,
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
                actual: "AI comparison failed - see logs",
                message: `JSON parsing failed: ${parseError}. Response was likely truncated.`,
              },
            ],
            bmps: [],
            implementation: [],
            monitoring: [],
          },
        };
      }
    } catch (error) {
      console.error("AI comparison failed:", error);
      throw new Error(`AI comparison failed: ${error}`);
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
        max_tokens: 4000,
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
        console.error("Failed to parse AI response as JSON:");
        console.error("Original content:", content.substring(0, 500) + "...");
        console.error(
          "Cleaned content:",
          cleanedContent.substring(0, 500) + "..."
        );
        throw new Error(
          `JSON parsing failed: ${parseError}. AI response may be malformed or truncated.`
        );
      }
    } catch (error) {
      console.error(`OpenAI extraction failed with ${CURRENT_MODEL}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(
        `OpenAI extraction failed (${CURRENT_MODEL}): ${errorMessage}`
      );
    }
  }

  private buildExtractionPrompt(text: string): string {
    // TODO: provide a way to attach optionally a series of prompts to further enhance result. this will of course take more token but for the sake of increasing accuracy, it may be beneficial. something like a flag to 'attachEnhancementPrompts'

    return `
Extract structured information from this watershed management document. Return ONLY valid JSON in the exact format specified below.

Document text:
${text.substring(0, 8000)}

Note: The input text is extracted from parsed PDFs, so tables and structured data may not appear in obvious table format. Please carefully analyze the text to identify information that likely originated from tables, such as repeated patterns, grouped short phrases, or sequences following headers like "Milestone," "Outcome," or "Date." Extract goals from these table-like structures as well, even if the table formatting is lost.

IMPORTANT INSTRUCTIONS:
1. Extract all information into the appropriate arrays first
2. THEN calculate reportSummary counts based on what you extracted:
   - totalGoals = exact count of items in "goals" array
   - totalBMPs = exact count of items in "bmps" array  
   - completionRate = count of "completed" status items / total implementation items (0 if no implementation items)
3. Double-check that your reportSummary numbers match your array lengths
4. Do NOT use null for counts - use actual numbers (0 if empty)
5. CRITICAL - Extract ALL quantitative data accurately:
   - Look for numbers with units (acres, feet, dollars, percentages, etc.)
   - Extract cost estimates, quantities, target values, thresholds
   - Include specific dates, timelines, and numeric goals
   - If a number is mentioned, capture both the value and unit
6. GOAL EXTRACTION RULES:
   - A goal is any major intended outcome, milestone, or management action that is explicitly stated in the watershed plan as something to be achieved, established, or completed. This includes environmental targets, project milestones, management steps, and outreach/education achievements.
   - Only extract goals that are clearly defined and explicitly stated in the document. Do not infer, summarize, or create goals that are not directly described or labeled in the text.
   - Goals may be found in narrative text, bullet lists, or tables under sections like "Goals," "Objectives," "Milestones," "Expected Outcomes," or similar headings.
   - Use the exact language from the document when possible. Paraphrase only for clarity if the goal is split across sentences, but do not invent new goals.
   - CRITICAL: For each goal extracted, include a brief excerpt (approximately 20 words) from the document where you found this goal. This should be the key phrase or sentence that contains the goal statement.

Required JSON format:
{
  "reportSummary": {
    "totalGoals": number,
    "totalBMPs": number,
    "completionRate": number_between_0_and_1
  },
  "goals": [
    {
      "id": "optional_id",
      "description": "goal description",
      "objective": "specific objective",
      "targetArea": "geographic target area",
      "schedule": "timeline or schedule",
      "contacts": [{"name": "contact name", "role": "role", "organization": "org"}],
      "desiredOutcomes": ["outcome1", "outcome2"],
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
      "partners": [{"name": "organization name"}],
      "schedule": "implementation schedule",
      "priorityFactors": ["factor1", "factor2"]
    }
  ],
  "implementation": [
    {
      "description": "activity description",
      "responsibleParties": [{"name": "organization"}],
      "startDate": "YYYY-MM-DD or descriptive date",
      "endDate": "YYYY-MM-DD or descriptive date",
      "status": "status description",
      "outcome": "expected or actual outcome",
      "probableCompletionDate": "completion date"
    }
  ],
  "monitoring": [
    {
      "description": "monitoring description",
      "indicator": "what is being measured",
      "method": "monitoring method",
      "frequency": "how often",
      "thresholds": [{"parameter": "param name", "value": "threshold value", "units": "units"}],
      "responsibleParties": [{"name": "organization"}],
      "sampleLocations": ["location1", "location2"],
      "sampleSchedule": "when samples are taken"
    }
  ],
  "outreach": [
    {
      "name": "outreach activity name",
      "description": "activity description",
      "partners": [{"name": "partner organization"}],
      "indicators": "success indicators",
      "schedule": "activity schedule",
      "budget": number_or_null,
      "events": [{"type": "event type", "audience": "target audience"}],
      "targetAudience": "primary audience"
    }
  ],
  "geographicAreas": [
    {
      "name": "area name",
      "counties": ["county1", "county2"],
      "acreage": number_or_null,
      "landUseTypes": [{"type": "cropland", "percent": 25}],
      "population": number_or_null,
      "towns": ["town1", "town2"],
      "huc": "HUC code if available",
      "description": "area description"
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
- Extract only information explicitly stated in the document
- Do not infer or make up data  
- If a field is not found, omit it or set to null
- ALWAYS calculate reportSummary counts accurately based on your extracted arrays
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
    "monitoring": [{"type": "...", "category": "monitoring", "expected": "...", "actual": "...", "message": "..."}]
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
        objective: goal.objective?.substring(0, 200) || "",
      })),
      bmps: (data.bmps || []).slice(0, 10).map((bmp) => ({
        name: bmp.name?.substring(0, 100) || "",
        description: bmp.description?.substring(0, 200) || "",
      })),
      implementation: (data.implementation || []).slice(0, 10).map((impl) => ({
        description: impl.description?.substring(0, 200) || "",
      })),
      monitoring: (data.monitoring || []).slice(0, 10).map((mon) => ({
        description: mon.description?.substring(0, 200) || "",
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

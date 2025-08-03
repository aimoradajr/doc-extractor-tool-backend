import OpenAI from "openai";
import { ExtractedData } from "../types/types";

// EASY MODEL SWITCHING - Just change this line!
const CURRENT_MODEL = "gpt-3.5-turbo"; // or "gpt-4"
// const CURRENT_MODEL = "gpt-4"; // Use gpt-4 for better accuracy

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

  async extractStructuredData(text: string): Promise<ExtractedData> {
    try {
      const prompt = this.buildExtractionPrompt(text);

      const response = await this.openai.chat.completions.create({
        model: CURRENT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at extracting structured information from environmental and agricultural watershed management documents. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const extractedData = JSON.parse(content);
      const structuredData = this.validateAndStructureData(extractedData);

      // Add the model information to the response
      structuredData.model = CURRENT_MODEL;

      return structuredData;
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
   - CRITICAL: For each goal extracted, include the exact excerpt/quote from the document where you found this goal. This should be the literal text from the source document that you interpreted as a goal.

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

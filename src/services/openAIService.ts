import OpenAI from "openai";
import { ExtractedData } from "../types/types";

// 🔧 EASY MODEL SWITCHING - Just change this line!
const CURRENT_MODEL = "gpt-3.5-turbo"; // or "gpt-4"

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`🤖 Using ${CURRENT_MODEL} model`);
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
      console.error(
        `❌ OpenAI extraction failed with ${CURRENT_MODEL}:`,
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(
        `OpenAI extraction failed (${CURRENT_MODEL}): ${errorMessage}`
      );
    }
  }

  private buildExtractionPrompt(text: string): string {
    return `
Extract structured information from this watershed management document. Return ONLY valid JSON in the exact format specified below.

Document text:
${text.substring(0, 8000)}

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
      "desiredOutcomes": ["outcome1", "outcome2"]
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

Extract only information that is explicitly stated in the document. Do not infer or make up data. If a field is not found, omit it or set to null.
`;
  }

  private validateAndStructureData(data: any): ExtractedData {
    // Validate and provide defaults
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

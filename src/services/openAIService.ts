import OpenAI from "openai";
import { ExtractedReport } from "../types";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractStructuredData(text: string): Promise<ExtractedReport> {
    try {
      const prompt = this.buildExtractionPrompt(text);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
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
      return this.validateAndStructureData(extractedData);
    } catch (error) {
      console.error("OpenAI extraction failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`OpenAI extraction failed: ${errorMessage}`);
    }
  }

  private buildExtractionPrompt(text: string): string {
    return `
Extract structured information from this watershed management document. Return ONLY valid JSON in the exact format specified below.

Document text:
${text.substring(0, 8000)} // Limit text length for token limits

Required JSON format:
{
  "goals": [
    {
      "id": "goal_1",
      "title": "goal title",
      "description": "detailed description",
      "priority": "high|medium|low",
      "targetDate": "YYYY-MM-DD or null",
      "metrics": ["metric1", "metric2"]
    }
  ],
  "bmps": [
    {
      "id": "bmp_1", 
      "name": "BMP name",
      "description": "description",
      "category": "category",
      "implementation": "implementation details",
      "costEstimate": number_or_null,
      "effectiveness": "effectiveness description"
    }
  ],
  "implementation": [
    {
      "id": "impl_1",
      "activity": "activity description", 
      "responsible": "responsible party",
      "timeline": "timeline",
      "status": "planned|in-progress|completed",
      "relatedGoals": ["goal_1"]
    }
  ],
  "monitoring": [
    {
      "id": "mon_1",
      "parameter": "parameter name",
      "target": "target value",
      "frequency": "monitoring frequency", 
      "method": "monitoring method",
      "currentValue": number_or_null
    }
  ],
  "outreach": [
    {
      "id": "out_1",
      "activity": "outreach activity",
      "audience": "target audience",
      "method": "outreach method",
      "frequency": "frequency",
      "relatedGoals": ["goal_1"]
    }
  ],
  "geographicAreas": [
    {
      "id": "geo_1",
      "name": "area name",
      "type": "watershed|county|state|region",
      "description": "description"
    }
  ]
}

Extract only information that is explicitly stated in the document. Do not infer or make up data.
`;
  }

  private validateAndStructureData(data: any): ExtractedReport {
    // Validate and provide defaults
    return {
      summary: {
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

export const openAIService = new OpenAIService();

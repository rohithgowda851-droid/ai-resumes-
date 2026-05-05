import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  keywordMatch: number;
  feedback: string;
}

export async function rankResume(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze the following resume text against the job description provided.
    Provide a score from 0 to 100 based on how well the candidate matches the requirements.
    Identify key strengths and weaknesses.
    Calculate a keyword match percentage.
    Provide actionable feedback.

    Job Description:
    ${jobDescription}

    Resume Text:
    ${resumeText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "A score from 0 to 100" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of strengths" },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of areas for improvement" },
          keywordMatch: { type: Type.NUMBER, description: "Percentage of keyword match (0-100)" },
          feedback: { type: Type.STRING, description: "Detailed feedback to the recruiter" }
        },
        required: ["score", "strengths", "weaknesses", "keywordMatch", "feedback"]
      }
    }
  });

  const resultStr = response.text.trim();
  return JSON.parse(resultStr);
}

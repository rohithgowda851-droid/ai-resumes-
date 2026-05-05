import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ Prevent crash if key missing
if (!apiKey) {
  console.error("Missing VITE_GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  keywordMatch: number;
  feedback: string;
}

export async function rankResume(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
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
    model: "gemini-1.5-flash", // ✅ safer stable model
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywordMatch: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["score", "strengths", "weaknesses", "keywordMatch", "feedback"]
      }
    }
  });

  const resultStr = response.text.trim();
  return JSON.parse(resultStr);
}
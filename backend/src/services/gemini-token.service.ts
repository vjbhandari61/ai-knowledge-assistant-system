import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, EMBEDDING_MODEL } from "../config/env";

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

export async function countTokens(text: string): Promise<number> {
    const response = await ai.models.countTokens({
        model: EMBEDDING_MODEL,
        contents: text
    });

    return response.totalTokens ?? 0;
}

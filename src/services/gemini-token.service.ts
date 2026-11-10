import { ai } from "../config/gemini";
import { EMBEDDING_MODEL } from "../config/env";

export async function countTokens(text: string, model: string = EMBEDDING_MODEL): Promise<number> {
    const response = await ai.models.countTokens({
        model: EMBEDDING_MODEL,
        contents: text
    });

    return response.totalTokens ?? 0;
}

export async function generateEmbedding(
    text: string,
    task: "retrieval_document" | "retrieval_query"
): Promise<number[]> {
    const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: `task: ${task} | query: ${text}`,
        config: {
            outputDimensionality: 768
        }
    });

    const values = response.embeddings?.[0]?.values;

    if (!values || values.length !== 768) {
        throw new Error("Invalid embedding response");
    }

    return values;
}
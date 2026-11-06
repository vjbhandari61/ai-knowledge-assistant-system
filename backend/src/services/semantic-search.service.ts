import { db } from "../prisma/db";
import { generateEmbedding } from "./gemini-token.service";

export async function searchDocument(
    documentId: number,
    question: string,
    limit: number = 5
) {
    const queryEmbedding = await generateEmbedding(
        question,
        "retrieval_query"
    );

    const results = await db.orm.public.DocumentChunk.using.embedding_nearest(queryEmbedding).where({documentId}).select("id", "documentId", "chunkIndex", "pageNumber", "content", "tokenCount").limit(limit).all();

    return results;
}
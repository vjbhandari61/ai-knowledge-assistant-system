import { db } from "../prisma/db";
import { generateEmbedding } from "./gemini-token.service";

export async function searchDocument(
    documentId: number,
    question: string,
    limit: number = 5,
    minSimilarity: number = 0.70
) {
    const queryEmbedding = await generateEmbedding(
        question,
        "retrieval_query"
    );

    const plan = await db.sql.public.DocumentChunk.select(
        "id",
        "documentId",
        "chunkIndex",
        "pageNumber",
        "content",
        "tokenCount"
    ).select(
        "similarity",
        (f, fns) => fns.cosineSimilarity(f.embedding, queryEmbedding)
    ).where(
        (f, fns) => fns.and(
            fns.eq(f.documentId, documentId),
            fns.gt(
                fns.cosineSimilarity(f.embedding, queryEmbedding),
                minSimilarity
            )
        )
    ).orderBy(
        (f, fns) => fns.cosineSimilarity(f.embedding, queryEmbedding), { direction: "desc" }
    ).limit(limit).build();

    return await db.query(plan);
}
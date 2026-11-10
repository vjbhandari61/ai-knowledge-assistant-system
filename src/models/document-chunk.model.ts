import { db } from "../prisma/db";

interface CreateChunkInput {
    documentId: number;
    chunkIndex: number;
    pageNumber: number;
    content: string;
    tokenCount: number;
    embedding: number[];
}

export async function replaceDocumentChunks(documentId: number, chunks: CreateChunkInput[]) {
    return await db.transaction(async (tx) => {
        await tx.orm.public.DocumentChunk.where({ documentId }).delete();

        if (chunks.length === 0) return [];

        return await tx.orm.public.DocumentChunk.select("id", "documentId", "chunkIndex", "pageNumber", "content", "tokenCount", "embedding").createAll(chunks);
    });
}

export async function findChunksByDocumentId(documentId: number) {
    return await db.orm.public.DocumentChunk.where({ documentId }).select("id", "documentId", "chunkIndex", "pageNumber", "content", "tokenCount").all();
}
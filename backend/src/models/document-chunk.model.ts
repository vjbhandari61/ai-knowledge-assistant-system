import { db } from "../prisma/db";

interface CreateChunkInput {
    documentId: number;
    chunkIndex: number;
    pageNumber: number;
    content: string;
    tokenCount: number;
}

export async function createDocumentChunks(chunks: CreateChunkInput[]) {
    if (chunks.length === 0) return [];

    return await db.orm.public.DocumentChunk.createAll(chunks);
}

export async function findChunksByDocumentId(documentId: number) {
    return await db.orm.public.DocumentChunk.where({ documentId }).select("id", "documentId", "chunkIndex", "pageNumber", "content", "tokenCount").all();
}
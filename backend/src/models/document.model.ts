import { db } from "../prisma/db";

interface CreateDocumentInput {
    title: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    storagePath: string;
    userId: number;
}

export async function createDocument(data: CreateDocumentInput) {
    return await db.orm.public.Document.create(data);
};

export async function updateDocumentExtraction(
    id: number,
    extractedText: string,
    totalPages: number
) {
    return await db.orm.public.Document.where({ id }).update({
        extractedText,
        totalPages,
        status: "COMPLETED"
    });
}

export async function updateDocumentStatus(
    id: number,
    status: string
) {
    return await db.orm.public.Document.where({ id }).update({
        status
    });
}
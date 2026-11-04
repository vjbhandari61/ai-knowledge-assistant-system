import {db} from "../prisma/db";

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
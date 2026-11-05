import * as DocumentModel from "../models/document.model";
import * as UserModel from "../models/user.model";
import { addPDFProcessingJob } from "../queues/pdf-processing.queue";

interface UploadDocumentInput {
    userId: number;
    title: string;
    fileName: string;
    mimeType: string,
    fileSize: number;
    storagePath: string;
}   

export async function registerDocument(data: UploadDocumentInput) {
    const user = await UserModel.findUserById(data.userId);

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const document = await DocumentModel.createDocument(data);

    try {
        await DocumentModel.updateDocumentStatus(document.id, "QUEUED");
        
        const job = await addPDFProcessingJob({
            documentId: document.id,
            filePath: data.storagePath
        });

        return {
            ...document,
            jobId: job.id,
            status: "QUEUED"
        };

    } catch (error) {
        await DocumentModel.updateDocumentStatus(document.id, "FAILED");
        throw error;
    }
};

export async function getDocument(id: number) {
    const document = await DocumentModel.findDocumentById(id);

    if(!document) {
        throw new Error("DOCUMENT_NOT_FOUND");
    }

    return document;
}

export async function getUserDocuments(userId: number) {
    const user = await UserModel.findUserById(userId);

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return await DocumentModel.findDocumentsByUserId(userId);
}
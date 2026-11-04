import * as DocumentModel from "../models/document.model";
import * as UserModel from "../models/user.model";
import { extractPdfText } from "./pdf-extraction.service";

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
        const extracted = await extractPdfText(data.storagePath);

        await DocumentModel.updateDocumentExtraction(
            document.id,
            extracted.text,
            extracted.totalPages
        );

        return {
            ...document,
            extractedText: extracted.text,
            totalPages: extracted.totalPages,
            status: "COMPLETED"
        };
        
    } catch (error) {
        await DocumentModel.updateDocumentStatus(document.id, "FAILED");
        throw error;
    }
};
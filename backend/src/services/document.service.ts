import * as DocumentModel from "../models/document.model";
import * as UserModel from "../models/user.model";
import { extractPdfText } from "./pdf-extraction.service";
import { chunkPages } from "./chunking.service";

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

        console.log("Beginning Chunking Process ====================>")
        const chunks = await chunkPages(extracted.pages);

        console.table(
            chunks.map((chunk) => ({
                index: chunk.chunkIndex,
                page: chunk.pageNumber,
                tokens: chunk.tokenCount,
                characters: chunk.content.length
            })
        ));

        console.log("Chunks exceeding limit: ", chunks.filter((chunk) => chunk.tokenCount > 500).length); 

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
import * as DocumentModel from "../models/document.model";
import * as UserModel from "../models/user.model";

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

    return await DocumentModel.createDocument({
        ...data
    });
};
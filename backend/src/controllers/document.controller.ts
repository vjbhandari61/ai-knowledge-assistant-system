import type { Request, Response } from "express";
import * as DocumentService from "../services/document.service";

export async function uploadDocument(req: Request, res: Response) {
    try {
        if(!req.file) {
            res.status(400).json({
                error: "PDF file is required",
            });
            return;
        }

        const userId = Number(req.body.userId);

        if(!Number.isInteger(userId) || userId <= 0) {
            res.status(400).json({
                error: "Valid userId is required"
            });
            return;
        }

        const document = await DocumentService.registerDocument({
            userId,
            title: req.body.title || req.file.originalname,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            storagePath: req.file.path
        });

        res.status(201).json({
            message: "Document uploaded successfully",
            document
        });

    } catch (error) {
        if(error instanceof Error && error.message === "USER_NOT_FOUND") {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        console.error(error);
        res.status(500).json({error: "Failed to upload document"});
    }
}
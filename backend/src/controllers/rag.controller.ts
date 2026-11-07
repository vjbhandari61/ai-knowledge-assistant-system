import { Request, Response } from "express";
import { askDocument } from "../services/rag.service";

export async function askQuestion(
    req: Request,
    res: Response
) {
    try {
        const documentId = Number(req.params.documentId);
        const { question } = req.body;

        if(!Number.isInteger(documentId) || documentId <= 0) {
            return res.status(400).json({
                message: "Invalid Document ID"
            });
        }

        if(typeof question !== "string" || question.trim().length === 0) {
            return res.status(400).json({
                message: "Question is required"
            });
        }

        const result = await askDocument(documentId, question.trim());

        return res.status(200).json(result);

    } catch (error) {
        console.error("RAG Error: ", error);

        return res.status(500).json({
            message: "Failed to answer question"
        });
    }
}
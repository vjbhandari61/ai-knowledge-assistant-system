import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { extractPdfText } from "../services/pdf-extraction.service";
import { chunkPages } from "../services/chunking.service";
import { replaceDocumentChunks } from "../models/document-chunk.model";
import { updateDocumentExtraction, updateDocumentStatus } from "../models/document.model";
import { generateEmbedding } from "../services/gemini-token.service";

const worker = new Worker(
    "pdf-processing",
    async (job) => {
        if (job.name !== "process-pdf") {
            throw new Error(`Unknown job type: ${job.name}`);
        }

        const { documentId, filePath } = job.data;
        console.log(`Processing document: ${documentId}`);

        try {
            await updateDocumentStatus(documentId, "EXTRACTING");

            const extracted = await extractPdfText(filePath);

            await updateDocumentExtraction(documentId, extracted.text, extracted.totalPages);

            await updateDocumentStatus(documentId, "CHUNKING");

            const chunks = await chunkPages(extracted.pages);

            const chunksWithEmbeddings = await Promise.all(
                chunks.map(async (chunk) => ({
                    ...chunk,
                    documentId,
                    embedding: await generateEmbedding(
                        chunk.content,
                        "retrieval_document"
                    )
                }))
            );

            await replaceDocumentChunks(documentId, chunksWithEmbeddings);

            await updateDocumentStatus(documentId, "COMPLETED");

            console.log(
                `Document ${documentId} processed. ${chunks.length} chunks created.`
            );

            return {
                documentId,
                totalChunks: chunks.length
            };

        } catch (error) {
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 2
    }
)

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed: ${error.message}`);
});

console.log("PDF Processing worker started");
import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { extractPdfText } from "../services/pdf-extraction.service";
import { chunkPages } from "../services/chunking.service";
import { createDocumentChunks } from "../models/document-chunk.model";
import { updateDocumentStatus } from "../models/document.model";

const worker = new Worker(
    "pdf-processing",
    async (job) => {
        if(job.name !== "process-pdf") {
            throw new Error(`Unknown job type: ${job.name}`);
        }

        const {documentId, filePath} = job.data;
        console.log(`Processing document: ${documentId}`);

        try {
            await updateDocumentStatus(documentId, "EXTRACTING");

            const extracted = await extractPdfText(filePath);

            await updateDocumentStatus(documentId, "CHUNKING");

            const chunks = await chunkPages(extracted.pages);

            const chunksWithDocumentId = chunks.map((chunk) => ({
                ...chunk,
                documentId
            }));

            await createDocumentChunks(chunksWithDocumentId);

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
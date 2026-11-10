import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export interface PdfProcessingJobData {
    documentId: number;
    filePath: string
}

export const pdfProcessingQueue = new Queue<PdfProcessingJobData>(
    "pdf-processing",
    {
        connection: redisConnection
    }
);

export async function addPDFProcessingJob(
    data: PdfProcessingJobData
) {
    return await pdfProcessingQueue.add(
        "process-pdf",
        data,
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000
            },
            removeOnComplete: 100,
            removeOnFail: 500
        }
    );
}
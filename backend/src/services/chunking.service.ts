import { countTokens } from "./gemini-token.service";
import { CHUNK_SIZE, CHUNK_OVERLAP } from "../config/env";

interface Page {
    pageNumber: number;
    text: string;
}

export interface TextChunk {
    chunkIndex: number,
    pageNumber: number,
    content: string,
    tokenCount: number
}

async function findPrefixLength(text: string, tokenLimit: number): Promise<number> {
    let low = 1;
    let high = text.length;
    let best = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const tokens = await countTokens(text.slice(0, mid));

        if (tokens <= tokenLimit) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return best;
}

async function findOverlapLength(text: string, tokenLimit: number): Promise<number> {
    let low = 1;
    let high = text.length;
    let best = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const tokens = await countTokens(text.slice(-mid));

        if (tokens <= tokenLimit) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return best;
}

export async function chunkPages(pages: Page[]): Promise<TextChunk[]> {
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
        const text = page.text.trim();

        if (!text) continue;

        let remainingText = text;

        while (remainingText.length > 0) {
            let end = await findPrefixLength(remainingText, CHUNK_SIZE);

            if (end === 0) {
                throw new Error("Unable to create a chunk within the token limit");
            }

            if (end < remainingText.length) {
                const boundary = remainingText.lastIndexOf(" ", end);

                if (boundary > 0) {
                    end = boundary;
                }
            }

            const content = remainingText.slice(0, end).trim();
            const tokenCount = await countTokens(content);

            if (content) {
                chunks.push({
                    chunkIndex: chunkIndex++,
                    pageNumber: page.pageNumber,
                    content,
                    tokenCount
                });
            }

            if (end >= remainingText.length) break;
            
            const overlapLength = await findOverlapLength(remainingText.slice(0, end), CHUNK_OVERLAP);

            const nextStart = end - overlapLength;

            if (nextStart <= 0) {
                throw new Error("Chunking made no forward progress");
            }

            remainingText = remainingText.slice(nextStart);
        }
    }

    return chunks;
}
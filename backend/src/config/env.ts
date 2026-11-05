if(!process.env.PORT) {
    throw new Error("PORT is not configured")
}

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
}

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
}

if (!process.env.EMBEDDING_MODEL) {
    throw new Error("EMBEDDING_MODEL is not configured");
}

if (!process.env.CHUNK_SIZE) {
    throw new Error("CHUNK_SIZE is not configured");
}

if(!process.env.CHUNK_OVERLAP) {
    throw new Error("CHUNK_OVERLAP is not configured");
}

if(!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error("REDIS_HOST OR REDIS_PORT is not configured");
}

export const PORT = Number(process.env.PORT) || 3000;
export const DATABASE_URL = process.env.DATABASE_URL;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
export const CHUNK_SIZE = Number(process.env.CHUNK_SIZE);
export const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP);
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = Number(process.env.REDIS_PORT);
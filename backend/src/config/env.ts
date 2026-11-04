const port = Number(process.env.PORT);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
}

export const PORT = port || 3000;
export const DATABASE_URL = process.env.DATABASE_URL;
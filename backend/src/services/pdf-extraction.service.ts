import { PDFParse } from "pdf-parse";

export async function extractPdfText(filePath: string) {
    const parser = new PDFParse({
        url: filePath
    });

    try {
        const result = await parser.getText();

        return {
            text: result.text,
            totalPages: result.total
        };
        
    } finally {
        await parser.destroy();
    }
}
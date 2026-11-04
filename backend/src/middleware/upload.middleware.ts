import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, "uploads/");
    },

    filename: (_req, file, callback) => {
        const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
        callback(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            callback(new Error("Only PDF files are allowed"));
            return;
        }

        callback(null, true);
    }
});

export default upload;
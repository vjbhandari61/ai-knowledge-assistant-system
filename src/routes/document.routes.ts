import { Router } from "express";
import upload from "../middleware/upload.middleware";
import * as DocumentController from "../controllers/document.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, upload.single("file"), DocumentController.uploadDocument);
router.get("/user", authenticate, DocumentController.getUserDocuments);
router.get("/:id", authenticate, DocumentController.getDocument);

export default router;
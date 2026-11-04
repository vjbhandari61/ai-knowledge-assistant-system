import { Router } from "express";
import upload from "../middleware/upload.middleware";
import * as DocumentController from "../controllers/document.controller";

const router = Router();

router.post("/", upload.single("file"), DocumentController.uploadDocument);
router.get("/:id", DocumentController.getDocument);
router.get("/user/:userId", DocumentController.getUserDocuments);

export default router;
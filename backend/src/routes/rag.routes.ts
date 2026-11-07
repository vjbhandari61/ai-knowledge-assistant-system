import { Router } from "express";
import * as RagController from "../controllers/rag.controller";

const router = Router();

router.post("/:documentId/ask", RagController.askQuestion);

export default router;
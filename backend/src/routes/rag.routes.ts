import { Router } from "express";
import * as RagController from "../controllers/rag.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/:documentId/ask", authenticate, RagController.askQuestion);

export default router;
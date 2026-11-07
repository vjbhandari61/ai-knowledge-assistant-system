import { Router } from "express";
import * as UserController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authenticate, UserController.getCurrentUser);

export default router;
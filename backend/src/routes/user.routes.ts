import { Router } from "express";
import * as UserController from "../controllers/user.controller";

const router = Router();

router.get("/:email", UserController.getUser);

export default router;
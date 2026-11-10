import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    res.status(200).json({
        status: "healthy",
        message: "AI Knowledge Assistant API is running."
    });
});

export default router;
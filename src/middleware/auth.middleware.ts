import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/jwt.service";

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if(!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Access Token is required"
        });
    }

    const token = authHeader.slice(7).trim();

    try {
        const payload = verifyAccessToken(token);
        const userId = Number(payload.sub);

        if(!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json({
                error: "INVALID_TOKEN",
                message: "Invalid access token"
            });
        }

        req.user = { id: userId };

        next();
        
    } catch {
        return res.status(401).json({
            error: "INVALID_TOKEN",
            message: "Invalid or expired access token"
        });
    }
}
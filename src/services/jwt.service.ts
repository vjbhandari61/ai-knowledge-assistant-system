import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export interface AccessTokenPayload {
    sub: string;
}

export function generateAccessToken(userId: number): string {
    return jwt.sign({
        sub: String(userId)
    },
    JWT_SECRET,
    {
        algorithm: "HS256",
        expiresIn: "15m",
        issuer: "knowledge-assistant",
        audience: "knowledge-assistant-api"
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "knowledge-assistant",
        audience: "knowledge-assistant-api"
    }) as AccessTokenPayload;
}
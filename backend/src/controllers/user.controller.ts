import type { Request, Response } from "express";
import * as UserService from "../services/user.service";

export async function createUser(req: Request, res: Response) {
    try {
        const { email, name } = req.body;

        if (!email || typeof email !== "string") {
            res.status(400).json({
                error: "Valid email is required"
            });
            return;
        }

        if (name !== undefined && typeof name !== "string") {
            res.status(400).json({
                error: "Name must be a string"
            });
            return;
        }

        const user = await UserService.registerUser(email, name);
        res.status(201).json(user);

    } catch (error) {
        if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
            res.status(409).json({ error: "User already exists" });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function getUser(req: Request, res: Response) {
    try {
        const { email } = req.params;

        if (typeof email !== "string") {
            res.status(400).json({
                error: "Invalid email parameter"
            });
            return;
        }

        const user = await UserService.getUser(email);

        res.status(200).json(user);

    } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            res.status(400).json({ error: "User not found" });
            return;
        }

        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
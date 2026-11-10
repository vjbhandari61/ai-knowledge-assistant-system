import type { Request, Response } from "express";
import * as UserService from "../services/user.service";
import * as UserModel from "../models/user.model";

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

export async function getCurrentUser(req: Request, res: Response) {
    try {
        const user = await UserModel.findUserById(req.user!.id);

        if(!user) {
            return res.status(404).json({
                error: "USER_NOT_FOUND"
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Get current user error: ", error);

        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}
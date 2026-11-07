import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { registerUser, authenticateUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: "VALIDATION_ERROR",
            details: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    try {
        const { email, password, name } = validation.data;

        const user = await registerUser(email, password, name);

        return res.status(201).json({
            message: "Account created successfully",
            user
        });

    } catch (error) {
        if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({
                error: "USER_ALREADY_EXISTS",
                message: "An account with this email already exists"
            });
        }

        console.error("Registration Error: ", error);

        return res.status(500).json({
            error: "Internal Server Error",
            message: "Unable to create account"
        });
    }
}

export async function login(req: Request, res: Response) {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: "VALIDATION_ERROR",
            details: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    try {
        const { email, password } = validation.data;

        const user = await authenticateUser(email, password);

        return res.status(200).json({
            message: "Login Successful",
            user
        });
        
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                error: "INVALID_CREDENTIALS",
                message: "Invalid email or password"
            });
        }

        console.error("Login error: ", error);

        return res.status(500).json({
            error: "Internal Server Error",
            message: "Unable to log in"
        })
    }
}
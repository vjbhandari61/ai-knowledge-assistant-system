import {email, z} from "zod";

export const registerSchema = z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(12, "Password must be at least 12 characters").max(128, "Password must not exceed 128 characters"),
    name: z.string().trim().min(1).max(100).optional(),
}).strict();

export const loginSchema = z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128)
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
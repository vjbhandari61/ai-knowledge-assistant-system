import { db } from "../prisma/db";

export async function findUserByEmail(email: string) {
    return await db.orm.public.User.where({ email }).first();
}

export async function findUserById(id: number) {
    return await db.orm.public.User.where({ id }).select("id", "name", "email", "createdAt").first();
}

export async function createUser(email: string,  passwordHash: string, name?: string) {
    return await db.orm.public.User.select("id", "name", "email", "createdAt").create({
        email,
        passwordHash,
        name: name ?? null
    });
}
import { db } from "../prisma/db";

export async function findUserByEmail(email: string) {
    return await db.orm.public.User.where({ email }).first();
}

export async function findUserById(id: number) {
    return await db.orm.public.User.where({ id }).first();
}

export async function createUser(email: string, name?: string) {
    return await db.orm.public.User.create({
        email,
        name: name ?? null
    });
}
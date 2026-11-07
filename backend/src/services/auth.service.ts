import * as UserModel from "../models/user.model";
import { hashPassword, verifyPassword } from "./password.service";

export async function registerUser(email: string, password: string, name?: string) {
    const existingUser = await UserModel.findUserByEmail(email);

    if(existingUser){
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(password);

    try {
        return await UserModel.createUser(email, passwordHash, name);
    } catch (error) {
        throw error;
    }
}

export async function authenticateUser(
    email: string,
    password: string
) {
    const user = await UserModel.findUserByEmail(email);

    if(!user || !user.passwordHash){
        throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if(!isValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name
    }
}

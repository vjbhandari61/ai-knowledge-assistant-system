import * as UserModel from "../models/user.model";

export async function registerUser(email: string, name?: string) {
    const existingUser = await UserModel.findUserByEmail(email);

    if(existingUser){
        throw new Error("USER_ALREADY_EXISTS");
    }

    return await UserModel.createUser(email, name);
}

export async function getUser(email: string) {
    const user = await UserModel.findUserByEmail(email);

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return user;
}
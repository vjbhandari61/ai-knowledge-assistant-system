import * as UserModel from "../models/user.model";

export async function getUser(email: string) {
    const user = await UserModel.findUserByEmail(email);

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
    };
}
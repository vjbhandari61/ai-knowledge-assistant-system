import * as UserModel from "../models/user.model";

export async function getUser(email: string) {
    const user = await UserModel.findUserByEmail(email);

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return user;
}
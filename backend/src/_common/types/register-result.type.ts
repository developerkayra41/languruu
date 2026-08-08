import { UserResponse } from "src/_base/base.user.resonse";

export type RegisterResult = {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
};

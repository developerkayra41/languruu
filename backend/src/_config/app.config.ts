import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    MAX_USERS: Number(process.env.MAX_USERS ?? 0),
    MAX_GROUPS: Number(process.env.MAX_GROUPS ?? 15),
    ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? '',
}))
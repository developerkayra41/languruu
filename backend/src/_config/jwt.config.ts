import { registerAs } from "@nestjs/config";

export default registerAs('jwt', () => ({
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    REFRESH_EXPIRES_IN_DAYS: Number(process.env.REFRESH_EXPIRES_IN_DAYS ?? 30),
}));

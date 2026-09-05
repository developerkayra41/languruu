import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect: 'postgresql',
    out: './drizzle',
    schema: [
        "./src/_common/drizzle/users.ts",
        "./src/_common/drizzle/words.ts",
        "./src/_common/drizzle/user-sessions.ts",
        "./src/_common/drizzle/security-events.ts",
        "./src/_common/drizzle/marketplace.ts",
        "./src/_common/drizzle/top-performers.ts",
        "./src/_common/drizzle/auth-tokens.ts",
        "./src/_common/drizzle/error-logs.ts",
        "./src/_common/drizzle/reports.ts",
        "./src/_common/drizzle/friendships.ts",
        "./src/_common/drizzle/notifications.ts",
        "./src/_common/drizzle/messages.ts",
        "./src/_common/drizzle/global-chat.ts"
    ],
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    }
})
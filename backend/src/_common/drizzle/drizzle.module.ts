import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleProvider } from "./drizzle.provider";

@Module({
    imports:[ConfigModule],
    providers:[DrizzleProvider],
    exports:[DrizzleProvider]
})

export class DrizzleModule{}
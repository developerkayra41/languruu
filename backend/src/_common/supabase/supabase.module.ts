import { Module } from "@nestjs/common";
// import { ConfigModule } from "@nestjs/config";
import { SupabaseProvider } from "./supabase.provider";


@Module({
    imports:[],
    providers:[SupabaseProvider],
    exports:[SupabaseProvider]
})

export class SupabaseModule{}
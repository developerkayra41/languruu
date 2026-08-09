import { Module } from "@nestjs/common";
import { SupabaseProvider } from "./supabase.provider";


@Module({
    imports:[],
    providers:[SupabaseProvider],
    exports:[SupabaseProvider]
})

export class SupabaseModule{}
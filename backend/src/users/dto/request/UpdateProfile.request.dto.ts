import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

// dto/request/UpdateProfile.request.dto.ts
export class UpdateProfileRequestDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    user_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
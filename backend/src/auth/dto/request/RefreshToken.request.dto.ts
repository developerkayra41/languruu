import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class RefreshTokenRequestDTO {
    @ApiProperty({nullable: false })
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    refreshToken: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(6, { message: 'Şifre en az 6 karakter olmalı.' })
    password: string;
}
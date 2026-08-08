import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString({message:'Token string tipinde olmalı'})
    token: string;
}
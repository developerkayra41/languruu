import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UpdateEmailRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    new_email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    current_password: string;
}
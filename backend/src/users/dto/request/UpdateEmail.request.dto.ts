import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

// dto/request/UpdateEmail.request.dto.ts
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
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class RequestPasswordResetRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail({}, { message: 'Geçerli bir e-posta girin.' })
    email: string;
}
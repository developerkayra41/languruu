import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class SendReengagementRequestDTO {
    @ApiProperty({ example: 'kullanici@ornek.com' })
    @IsEmail({}, { message: 'Geçerli bir e-posta adresi gir.' })
    @MaxLength(254)
    email: string;
}

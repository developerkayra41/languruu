import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class SendMessageRequestDTO {
    @ApiProperty({ example: 'kayra' })
    @IsString()
    @Length(3, 16)
    @Matches(/^[a-zA-Z0-9_]+$/)
    user_name: string;

    @ApiProperty({ example: 'Selam, bugün çalışıyor musun?' })
    @IsString()
    @Length(1, 1000)
    body: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UnsubscribeRequestDTO {
    @ApiProperty({ description: 'Hatırlatma e-postasındaki imzalı token' })
    @IsString()
    @MaxLength(128)
    token: string;
}

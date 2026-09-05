import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class SendGlobalMessageRequestDTO {
    @ApiProperty({ example: 'Herkese selam!' })
    @IsString()
    @Length(1, 1000)
    body: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ShareIdRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    share_id: string;
}
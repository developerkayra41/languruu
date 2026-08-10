import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GoogleAuthRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    idToken: string;
}
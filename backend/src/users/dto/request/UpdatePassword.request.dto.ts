import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdatePasswordRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    current_password: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(8)
    new_password: string;
}
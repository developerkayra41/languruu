import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

// dto/request/UpdatePassword.request.dto.ts
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
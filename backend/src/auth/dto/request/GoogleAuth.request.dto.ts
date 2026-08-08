import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

// dto/request/GoogleAuth.request.dto.ts
export class GoogleAuthRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    idToken: string;
}
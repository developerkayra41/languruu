import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

// dto/request/ShareId.request.dto.ts
export class ShareIdRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    share_id: string;
}
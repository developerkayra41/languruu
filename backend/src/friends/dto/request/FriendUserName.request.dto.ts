import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class FriendUserNameRequestDTO {
    @ApiProperty({ example: 'kayra' })
    @IsString()
    @Length(3, 16)
    @Matches(/^[a-zA-Z0-9_]+$/)
    user_name: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class GameRoomsRequestDTO {
    @ApiProperty()
    @IsNotEmpty({ message: 'share_id boş olamaz.' })
    @IsString({ message: 'share_id geçersiz.' })
    @MaxLength(100, { message: 'share_id geçersiz.' })
    share_id: string;
}

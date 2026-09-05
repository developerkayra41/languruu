import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, Min } from "class-validator";

export class RespondFriendRequestDTO {
    @ApiProperty({ example: 3 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    request_id: number;

    @ApiProperty({ example: 'accept', enum: ['accept', 'reject'] })
    @IsIn(['accept', 'reject'])
    action: 'accept' | 'reject';
}

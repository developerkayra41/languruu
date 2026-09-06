import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty } from "class-validator";
import { PRESENCE_VISIBILITY_VALUES } from "src/_common/utils/presence";

export class UpdatePresenceVisibilityRequestDTO {
    @ApiProperty({ enum: PRESENCE_VISIBILITY_VALUES, example: 'friends', nullable: false })
    @IsNotEmpty()
    @IsIn(PRESENCE_VISIBILITY_VALUES)
    presence_visibility: string;
}

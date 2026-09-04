import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";
import { MAX_WORDS_PER_AWARD } from "src/_common/utils/xp-level";

export class AwardXpRequestDTO {
    @ApiProperty({ minimum: 1, maximum: MAX_WORDS_PER_AWARD })
    @IsInt()
    @Min(1)
    @Max(MAX_WORDS_PER_AWARD)
    words: number;
}

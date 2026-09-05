import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateReportRequestDTO {
    @ApiProperty()
    @IsIn(['profile', 'word_group', 'global_message'])
    target_type: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    target_ref: string;

    @ApiProperty()
    @IsIn(['adult_content', 'profanity', 'spam', 'other'])
    reason: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
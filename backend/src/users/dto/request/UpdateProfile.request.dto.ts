import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";
import { USERNAME_PATTERN } from "src/_common/utils/username";

export class UpdateProfileRequestDTO {
    @ApiProperty({ required: false, maxLength: 16, minLength: 3 })
    @IsOptional()
    @IsString()
    @MinLength(3, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MIN_LENGTH, 3) })
    @MaxLength(16, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MAX_LENGTH, 16) })
    @Matches(USERNAME_PATTERN, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_VALID) })
    user_name?: string;

    @ApiProperty({ required: false, maxLength: 50, minLength: 2 })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.MIN_LENGTH, 2) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.MAX_LENGTH, 50) })
    full_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}

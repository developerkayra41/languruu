import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";
import { USERNAME_PATTERN } from "src/_common/utils/username";

export class CompleteProfileSetupRequestDTO {
    @ApiProperty({ maxLength: 16, minLength: 3, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_EMPTY) })
    @IsString()
    @MinLength(3, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MIN_LENGTH, 3) })
    @MaxLength(16, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MAX_LENGTH, 16) })
    @Matches(USERNAME_PATTERN, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_VALID) })
    user_name: string;
}

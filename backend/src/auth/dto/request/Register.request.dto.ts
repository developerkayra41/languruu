import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";
import { USERNAME_PATTERN } from "src/_common/utils/username";

export class RegisterRequestDTO {

    @ApiProperty({ default: 'xkyr41', maxLength: 16, minLength: 3, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_EMPTY) })
    @MinLength(3, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MIN_LENGTH, 3) })
    @MaxLength(16, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MAX_LENGTH, 16) })
    @Matches(USERNAME_PATTERN, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_VALID) })
    user_name: string;

    @ApiProperty({ default: 'test@hotmail.com', maxLength: 50, minLength: 6, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.NOT_EMPTY) })
    @MinLength(6, { message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.MIN_LENGTH, 6) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.MAX_LENGTH, 50) })
    email: string;

    @ApiProperty({ default: 'Kayra Özgür', maxLength: 50, minLength: 2, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.NOT_EMPTY) })
    @MinLength(2, { message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.MIN_LENGTH, 2) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.MAX_LENGTH, 50) })
    full_name: string;

    @ApiProperty({ default: '123456', maxLength: 50, minLength: 6, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.NOT_EMPTY) })
    @MinLength(6, { message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.MIN_LENGTH, 6) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.MAX_LENGTH, 50) })
    password: string;
}
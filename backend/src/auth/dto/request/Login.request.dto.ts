import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength, MinLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";

export class LoginRequestDTO {
    @ApiProperty({ default: 'test@hotmail.com', maxLength: 50, minLength: 6, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.NOT_EMPTY) })
    @MinLength(6, { message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.MIN_LENGTH, 6) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.EMAIL, ValidationType.MAX_LENGTH, 50) })
    email: string;

    @ApiProperty({ default: '123456', maxLength: 50, minLength: 6, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.NOT_EMPTY) })
    @MinLength(6, { message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.MIN_LENGTH, 6) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.PASSWORD, ValidationType.MAX_LENGTH, 50) })
    password: string;
}
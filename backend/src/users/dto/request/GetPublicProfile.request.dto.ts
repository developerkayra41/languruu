import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";

export class GetPublicProfileRequestDTO {
    @ApiProperty({ example: 'namesurname', maxLength: 50, nullable: false })
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.NOT_EMPTY) })
    @IsString({ message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MUST_BU_STRING) })
    @MinLength(2, { message: getValidationMessage(DtoPrefix.FULLNAME, ValidationType.MIN_LENGTH, 2) })
    @MaxLength(50, { message: getValidationMessage(DtoPrefix.USERNAME, ValidationType.MAX_LENGTH, 50) })
    user_name: string;
}
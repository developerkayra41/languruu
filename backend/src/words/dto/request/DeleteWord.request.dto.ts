import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";

export class DeleteWordRequestDTO {
    @ApiProperty()
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.WORD_ID, ValidationType.NOT_EMPTY) })
    @IsNumber({}, { message: getValidationMessage(DtoPrefix.WORD_ID, ValidationType.MUST_BU_NUMBER) })
    word_id: number;
}
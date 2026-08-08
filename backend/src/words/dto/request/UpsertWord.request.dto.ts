import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsObject, ValidateNested } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";
import { WordRequestDTO } from "./Word.request.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpsertWordRequestDTO {
    @ApiProperty({type: WordRequestDTO})
    @IsNotEmpty({ message: getValidationMessage(DtoPrefix.WORDS, ValidationType.NOT_EMPTY) })
    @IsObject({ message: getValidationMessage(DtoPrefix.WORDS, ValidationType.MUST_BE_OBJECT) })
    @ValidateNested({ each: true })
    @Type(() => WordRequestDTO)
    words: WordRequestDTO;
}
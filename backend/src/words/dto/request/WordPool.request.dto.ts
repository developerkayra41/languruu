import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";

export class WordPoolDTO {
  @ApiProperty()
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.TERM, ValidationType.NOT_EMPTY) })
  @IsArray({ message: getValidationMessage(DtoPrefix.TERM, ValidationType.MUST_BE_ARRAY) })
  @IsString({ each: true, message: 'Kelime metni geçersiz' })
  @MaxLength(24, { each: true, message: 'Bir kelime/anlam en fazla 24 karakter olabilir.' })
  term: string[]

  @ApiProperty()
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.TRANSLATION, ValidationType.NOT_EMPTY) })
  @IsArray({ message: getValidationMessage(DtoPrefix.TRANSLATION, ValidationType.MUST_BE_ARRAY) })
  @IsString({ each: true, message: 'Kelime metni geçersiz' })
  @MaxLength(24, { each: true, message: 'Bir kelime/anlam en fazla 24 karakter olabilir.' })
  translation: string[]
}
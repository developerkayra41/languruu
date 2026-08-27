import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { DtoPrefix, getValidationMessage, ValidationType } from "src/_common/enums/ValidationMessages.enum";

export class WordExampleDTO {
  @ApiProperty()
  @IsNotEmpty({ message: 'Örnek cümle boş olamaz.' })
  @IsString({ message: 'Örnek cümle metni geçersiz' })
  @MaxLength(200, { message: 'Örnek cümle en fazla 200 karakter olabilir.' })
  text: string

  @ApiProperty()
  @IsNotEmpty({ message: 'Örnek cümlenin çevirisi boş olamaz.' })
  @IsString({ message: 'Örnek cümle çevirisi geçersiz' })
  @MaxLength(200, { message: 'Örnek cümle çevirisi en fazla 200 karakter olabilir.' })
  translation: string
}

export class WordPoolDTO {
  @ApiProperty()
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.TERM, ValidationType.NOT_EMPTY) })
  @IsArray({ message: getValidationMessage(DtoPrefix.TERM, ValidationType.MUST_BE_ARRAY) })
  @IsString({ each: true, message: 'Kelime metni geçersiz' })
  @MaxLength(100, { each: true, message: 'Bir kelime/anlam en fazla 100 karakter olabilir.' })
  term: string[]

  @ApiProperty()
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.TRANSLATION, ValidationType.NOT_EMPTY) })
  @IsArray({ message: getValidationMessage(DtoPrefix.TRANSLATION, ValidationType.MUST_BE_ARRAY) })
  @IsString({ each: true, message: 'Kelime metni geçersiz' })
  @MaxLength(100, { each: true, message: 'Bir kelime/anlam en fazla 100 karakter olabilir.' })
  translation: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Not metni geçersiz' })
  @MaxLength(200, { message: 'Not en fazla 200 karakter olabilir.' })
  note?: string

  @ApiPropertyOptional({ type: [WordExampleDTO] })
  @IsOptional()
  @IsArray({ message: 'Örnek cümleler dizi olmalıdır.' })
  @ArrayMaxSize(3, { message: 'Bir kelimeye en fazla 3 örnek cümle eklenebilir.' })
  @ValidateNested({ each: true })
  @Type(() => WordExampleDTO)
  examples?: WordExampleDTO[]
}

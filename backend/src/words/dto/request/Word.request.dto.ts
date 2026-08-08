import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsBoolean, IsDate, IsDateString, ArrayMaxSize } from "class-validator";
import { WordPoolDTO } from "./WordPool.request.dto";
import { Type } from "class-transformer";
import { getValidationMessage, ValidationType, WordDtoPrefix } from "src/_common/enums/ValidationMessages.enum";
import { ApiProperty } from "@nestjs/swagger";

export class WordRequestDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber({}, { message: getValidationMessage(WordDtoPrefix.WORDS_ID, ValidationType.MUST_BU_NUMBER) })
    id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: getValidationMessage(WordDtoPrefix.SHARE_ID, ValidationType.MUST_BU_STRING) })
    shareId?: string;

    @ApiProperty()
    @IsNotEmpty({ message: getValidationMessage(WordDtoPrefix.NAME, ValidationType.NOT_EMPTY) })
    @IsString({ message: getValidationMessage(WordDtoPrefix.NAME, ValidationType.MUST_BU_STRING) })
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: getValidationMessage(WordDtoPrefix.DESCRIPTION, ValidationType.MUST_BU_STRING) })
    description?: string;

    @ApiProperty({ type: [WordPoolDTO] })
    @IsNotEmpty({ message: getValidationMessage(WordDtoPrefix.WORD_POOL, ValidationType.NOT_EMPTY) })
    @IsArray({ message: getValidationMessage(WordDtoPrefix.WORD_POOL, ValidationType.MUST_BE_ARRAY) })
    @ArrayMaxSize(250, { message: 'Bir kelime grubunda en fazla 250 kelime olabilir.' })
    @ValidateNested({ each: true })
    @Type(() => WordPoolDTO)
    wordPool: WordPoolDTO[];

    @ApiProperty({ type: [String] })
    @IsArray({ message: getValidationMessage(WordDtoPrefix.LANGUAGES, ValidationType.MUST_BE_ARRAY) })
    @IsString({ each: true, message: getValidationMessage(WordDtoPrefix.LANGUAGES, ValidationType.MUST_BU_STRING) })
    languages: string[];

    @ApiProperty()
    @IsNotEmpty({ message: getValidationMessage(WordDtoPrefix.CREATED_AT, ValidationType.NOT_EMPTY) })
    @IsDateString({}, { message: getValidationMessage(WordDtoPrefix.CREATED_AT, ValidationType.IS_DATE_STRING) })
    createdAt: Date;

    @ApiProperty()
    @IsNotEmpty({ message: getValidationMessage(WordDtoPrefix.IS_SHARED, ValidationType.NOT_EMPTY) })
    @IsBoolean({ message: getValidationMessage(WordDtoPrefix.IS_SHARED, ValidationType.MUST_BE_BOOLEAN) })
    isShared: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceShareId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceAuthorUsername?: string;
}
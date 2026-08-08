import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

// dto/request/SearchMarketplace.request.dto.ts
export class SearchMarketplaceRequestDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    page: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    pageSize: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    onlyMine?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sourceLanguage?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    targetLanguage?: string;
}
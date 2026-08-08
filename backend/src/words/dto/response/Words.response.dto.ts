import { BaseResponse } from "src/_base/base.response";
import { WordColumnDTO, WordColumnWithoutPoolDTO } from "./Words.dto";
import { ApiProperty } from "@nestjs/swagger";

export class WordColumnResponseDTO extends BaseResponse<WordColumnDTO> {
    @ApiProperty({ type: WordColumnDTO })
    declare data: WordColumnDTO;
}

export class WordColumnWithoutPool extends BaseResponse<WordColumnWithoutPoolDTO> {
    @ApiProperty({ type: WordColumnWithoutPoolDTO })
    declare data: WordColumnWithoutPoolDTO;
}
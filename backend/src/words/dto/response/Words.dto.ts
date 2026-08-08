import { ApiProperty, OmitType } from "@nestjs/swagger";

export class WordPoolDTO {
    @ApiProperty()
    term: string[]
    @ApiProperty()
    translation: string[]
}

export class WordColumnDTO {
    @ApiProperty()
    id: number;
    @ApiProperty()
    name: string;
    @ApiProperty()
    description?: string;
    @ApiProperty({ type: [WordPoolDTO] })
    wordPool: WordPoolDTO[];
    @ApiProperty()
    createdAt: Date;
    @ApiProperty()
    isShared: boolean;
}

export class WordRowDTO {
    @ApiProperty()
    id: number;
    @ApiProperty()
    user_id: number;
    @ApiProperty({ type: [WordColumnDTO] })
    words: WordColumnDTO[]
}

export class WordColumnWithoutPoolDTO extends OmitType(WordColumnDTO, ['wordPool'] as const) { }
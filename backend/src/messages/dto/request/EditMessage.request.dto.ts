import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsString, Length, Min } from "class-validator";

export class EditMessageRequestDTO {
    @ApiProperty({ example: 42 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;

    @ApiProperty({ example: 'Selam, düzelttim.' })
    @IsString()
    @Length(1, 1000)
    body: string;
}

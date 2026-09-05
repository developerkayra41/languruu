import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class GlobalMessageIdRequestDTO {
    @ApiProperty({ example: 42 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;
}

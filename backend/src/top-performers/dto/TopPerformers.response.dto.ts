import { ApiProperty } from "@nestjs/swagger";

export class TopPerformersDTO {
    @ApiProperty() user_id: number;
    @ApiProperty() user_name: string;
    @ApiProperty() full_name: string;
    @ApiProperty() total_word: number;
    @ApiProperty({ required: false }) avatar_url?: string;
}
import { ApiProperty } from "@nestjs/swagger";

export class GamePlayerProfileDTO {
    @ApiProperty() userId: number;
    @ApiProperty() userName: string;
    @ApiProperty() fullName: string;
    @ApiProperty({ required: false }) avatarUrl?: string;
}

export class GameTicketDTO {
    @ApiProperty() ticket: string;
    @ApiProperty() expiresIn: number;
    @ApiProperty() serverNow: number;
    @ApiProperty({ type: GamePlayerProfileDTO }) user: GamePlayerProfileDTO;
}

export class GameRoomSummaryDTO {
    @ApiProperty() code: string;
    @ApiProperty() shareId: string;
    @ApiProperty() groupName: string;
    @ApiProperty({ type: [String] }) languages: string[];
    @ApiProperty() hostUserName: string;
    @ApiProperty() hostFullName: string;
    @ApiProperty() playerCount: number;
    @ApiProperty() maxPlayers: number;
    @ApiProperty() secondsPerQuestion: number;
    @ApiProperty() questionCount: number;
    @ApiProperty() createdAt: number;
}

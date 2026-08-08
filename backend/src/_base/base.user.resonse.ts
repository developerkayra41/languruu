import { ApiProperty } from "@nestjs/swagger";

export class UserResponse {
    @ApiProperty()
    id: number;
    @ApiProperty()
    user_name: string;
    @ApiProperty()
    full_name: string;
    @ApiProperty()
    email: string;
    @ApiProperty()
    description: string | null;
    @ApiProperty()
    avatar_url: string | null;
    @ApiProperty()
    email_verified: boolean;
}
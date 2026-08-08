import { ApiProperty } from "@nestjs/swagger";

export class BaseResponse<T> {
    @ApiProperty()
    data: T;
    @ApiProperty()
    message: string;
    @ApiProperty()
    success: boolean;

    constructor(data: T, message: string, success: boolean) {
        this.data = data;
        this.message = message;
        this.success = success;
    }
}
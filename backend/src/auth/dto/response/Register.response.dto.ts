import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/_base/base.response";
import { UserResponse } from "src/_base/base.user.resonse";

export class RegisterResponseData {
    @ApiProperty()
    user: UserResponse;
    @ApiProperty()
    accessToken: string;
}

export class RegisterResponseDTO extends BaseResponse<RegisterResponseData> {
    @ApiProperty({type: RegisterResponseData})
    declare data: RegisterResponseData
}
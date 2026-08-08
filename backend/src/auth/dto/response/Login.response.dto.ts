import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/_base/base.response";
import { UserResponse } from "src/_base/base.user.resonse";

export class LoginResponseData {
    @ApiProperty()
    user: UserResponse;
    @ApiProperty()
    accessToken: string;
}

export class LoginResponseDTO extends BaseResponse<LoginResponseData> {
    @ApiProperty({type: LoginResponseData})
    declare data: LoginResponseData
}
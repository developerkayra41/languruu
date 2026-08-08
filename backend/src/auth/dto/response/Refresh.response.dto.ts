import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/_base/base.response";

export class RefreshTokenResponseData {
    @ApiProperty()
    accessToken: string;

}

export class RefreshTokenResponseDTO extends BaseResponse<RefreshTokenResponseData> {
    @ApiProperty({type: RefreshTokenResponseData})
    declare data: RefreshTokenResponseData
}
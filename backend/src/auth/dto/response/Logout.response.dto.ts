import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/_base/base.response";

export class LogoutResponseData {
  @ApiProperty()
  success: boolean;
}

export class LogoutResponseDTO extends BaseResponse<LogoutResponseData> {
    @ApiProperty({type: LogoutResponseData})
    declare data: LogoutResponseData
}

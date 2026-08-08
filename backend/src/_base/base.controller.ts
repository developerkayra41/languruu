import { HttpStatus } from "@nestjs/common";
import { Request } from "express";
import { BaseResponse } from "./base.response";

export abstract class BaseController {
    private readonly controllerName: string;
    constructor(controllerName: string) {
        this.controllerName = controllerName
    }

    protected createSuccessResponse(data: { data: any, message: string, success: boolean }, req: any) {
        return data;
    }

    protected createErrorResponse(error: { message: string, statusCode: HttpStatus }, req: any) {
        return new BaseResponse(null, error.message, false);
    }
}
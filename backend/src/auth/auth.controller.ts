import { Inject, Res, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { BaseController } from 'src/_base/base.controller';
import { AuthService } from './auth.service';
import { RegisterRequestDTO } from './dto/request/Register.request.dto';
import { LoginRequestDTO } from './dto/request/Login.request.dto';
import { LoginResponseDTO } from './dto/response/Login.response.dto';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogoutResponseDTO } from './dto/response/Logout.response.dto';
import { RefreshTokenResponseDTO } from './dto/response/Refresh.response.dto';
import { LoginResult } from 'src/_common/types/login-result.type';
import type { Request, Response } from 'express';
import { RegisterResult } from 'src/_common/types/register-result.type';
import { RefreshResult } from 'src/_common/types/refresh-result.type';
import { GoogleAuthRequestDTO } from './dto/request/GoogleAuth.request.dto';
import { Throttle } from '@nestjs/throttler';
import { RegisterResponseDTO } from './dto/response/Register.response.dto';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, refreshCookieOptions } from './auth.cookie';
import { VerifyEmailRequestDTO } from './dto/request/VerifyEmail.request.dto';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { RequestPasswordResetRequestDTO } from './dto/request/RequestPasswordReset.dto';
import { ResetPasswordRequestDTO } from './dto/request/ResetPasswordRequest.dto';
import { DeleteAccountRequestDTO } from './dto/request/DeleteAccount.dto';
@Controller('auth')
@ApiTags('Auth')
export class AuthController extends BaseController {

    constructor(@Inject(AuthService) private readonly authService: AuthService
    ) {
        super('AuthController')
    }

    @Post('register')
    @Throttle({ default: { ttl: 60_000, limit: 3 } }) // 60sn'de 3 kayıt denemesi
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiCreatedResponse({ type: RegisterResponseDTO })
    @ApiOperation({ summary: 'Register API', description: 'Bu API user kayıt işlemlerini yapar' })
    @ApiBody({ type: RegisterRequestDTO })
    async register(@Body() body: RegisterRequestDTO, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<RegisterResponseDTO> {

        const result: RegisterResult = await this.authService.register(body, req)

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        const dto = new RegisterResponseDTO({ user: result.user, accessToken: result.accessToken }, 'success', true)
        return this.createSuccessResponse(dto, req)

    }

    @Post('login')
    @Throttle({ default: { ttl: 60_000, limit: 5 } }) // 60sn'de 5 login denemesi
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: LoginResponseDTO })
    @ApiOperation({ summary: 'Login API', description: 'Bu API user giriş işlemlerini yapar' })
    @ApiBody({ type: LoginRequestDTO })
    async login(@Body() body: LoginRequestDTO, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDTO> {

        const result: LoginResult = await this.authService.login(body, req);

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        const dto = new LoginResponseDTO({ user: result.user, accessToken: result.accessToken }, 'success', true)
        return this.createSuccessResponse(dto, req)

    }

    @Post('logout')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: LogoutResponseDTO })
    @ApiOperation({ summary: 'Logout API', description: 'Bu API user çıkış işlemlerini yapar' })
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponseDTO> {
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
            const session = await this.authService.findByRefreshTokenHash(refreshToken)
            if (session) await this.authService.revoke(session.id);
        }

        res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req)
    }

    @Post('refresh')
    @Throttle({ default: { ttl: 60_000, limit: 20 } })  // refresh daha sık olur, biraz gevşek
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: RefreshTokenResponseDTO })
    @ApiOperation({ summary: 'Refresh API', description: 'Bu API refresh işlemlerini yapar' })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<RefreshTokenResponseDTO> {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) throw new UnauthorizedException();

        const result: RefreshResult = await this.authService.refresh(refreshToken, req);

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        return this.createSuccessResponse({ data: { accessToken: result.accessToken }, message: 'success', success: true }, req
        );

    }

    @Post('google')
    @Throttle({ default: { ttl: 60_000, limit: 5 } })   // login ile aynı mantık
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOkResponse({ type: LoginResponseDTO })
    @ApiOperation({ summary: 'Google ile giriş/kayıt', description: 'Google ID token doğrulanır, kullanıcı bulunur/oluşturulur' })
    @ApiBody({ type: GoogleAuthRequestDTO })
    async google(@Body() body: GoogleAuthRequestDTO, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDTO> {
        const result: LoginResult = await this.authService.loginWithGoogle(body.idToken, req);

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

        const dto = new LoginResponseDTO({ user: result.user, accessToken: result.accessToken }, 'success', true);
        return this.createSuccessResponse(dto, req);
    }

    @Post('verify-email')
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'verify-email', description: 'E-Posta onay bağlantısı gönderir' })
    @ApiBody({ type: VerifyEmailRequestDTO })
    async verifyEmail(@Body() body: VerifyEmailRequestDTO, @Req() req: Request) {
        await this.authService.verifyEmail(body.token);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('resend-verification')
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'resend-verification', description: 'E-Posta onay bağlantısını tekrar gönderir' })
    async resendVerification(@Req() req: any) {
        await this.authService.resendVerification(req.user.id);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @Post('request-password-reset')
    @Throttle({ default: { ttl: 60_000, limit: 3 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'request-password-reset', description: 'Şifre sıfırlama isteğini tekrar gönderir' })
    async requestPasswordReset(@Body() body: RequestPasswordResetRequestDTO, @Req() req: Request) {
        await this.authService.requestPasswordReset(body.email);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @Post('reset-password')
    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'reset-password', description: 'Şifre sıfırlama isteğini gönderir' })
    async resetPassword(@Body() body: ResetPasswordRequestDTO, @Req() req: Request) {
        await this.authService.resetPassword(body.token, body.password);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'logout-all', description: 'Tüm cihazlardaki oturumları sonlandırır' })
    async logoutAll(@Req() req: any) {
        await this.authService.logoutAllDevices(req.user.id);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }
    @UseGuards(JwtAuthGuard)
    @Post('delete-account')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @ApiOperation({ summary: 'delete-account', description: 'Hesabı siler (soft-delete)' })
    async deleteAccount(@Body() body: DeleteAccountRequestDTO, @Req() req: any) {
        await this.authService.deleteAccount(req.user.id, body.password);
        return this.createSuccessResponse({ data: { success: true }, message: 'success', success: true }, req);
    }

}

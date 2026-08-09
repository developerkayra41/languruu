import { SecurityEventRepository } from './repository/security-event.repository';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterRequestDTO } from './dto/request/Register.request.dto';
import { UserResponse } from 'src/_base/base.user.resonse';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from 'src/_common/payloads/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDTO } from './dto/request/Login.request.dto';
import { AuthUser } from 'src/_common/types/auth-user.type';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { UserSessionRepository } from 'src/auth/repository/user-session.repository';
import { sha256 } from 'js-sha256';
import { LoginResult } from 'src/_common/types/login-result.type';
import { RegisterResult } from 'src/_common/types/register-result.type';
import { UserSessionResult } from 'src/_common/types/user-session.type';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { clientInfo } from 'src/_common/utils/utils-info';
import { MailService } from 'src/mail/mail.service';
import { AuthTokenRepository } from './repository/auth-token.repository';
import { containsProfanity } from 'src/_common/moderation/profanity';
@Injectable()
export class AuthService {
    private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    private readonly refreshGraceCache = new Map<string, { accessToken: string; refreshToken: string; expiresAt: number }>();
    private static readonly GRACE_MS = 10_000;
    constructor(@Inject(UsersService)
    private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly userSessionRepo: UserSessionRepository,
        private readonly securityEventRepo: SecurityEventRepository,
        private readonly mailService: MailService,
        private readonly authTokenRepo: AuthTokenRepository
    ) { }

    private refreshExpiresAt(): Date {
        const days = this.config.get<number>('jwt.REFRESH_EXPIRES_IN_DAYS') ?? 30;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    private async issueSession(user: { id: number }, req: Request): Promise<{ accessToken: string; refreshToken: string }> {
        const payload: JwtPayload = { sub: user.id };
        const accessToken = this.jwtService.sign(payload);

        const refreshToken = randomUUID();
        const hashedRefreshToken = sha256(refreshToken);
        const familyId = randomUUID();

        const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null;
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown';

        await this.userSessionRepo.create({
            user_id: user.id,
            family_id: familyId,
            refresh_token_hash: hashedRefreshToken,
            device_id: deviceId,
            user_agent: userAgent,
            ip_address: ipAddress,
            expires_at: this.refreshExpiresAt(),
        });

        return { accessToken, refreshToken };
    }

    private async assertUserQuotaAvailable(): Promise<void> {
        const maxUsers = this.config.get<number>('app.MAX_USERS') ?? 0;
        if (maxUsers <= 0) return;
        const count = await this.userService.countActiveUsers();
        if (count >= maxUsers) {
            throw new ForbiddenException(`Kayıt kontenjanı dolu (maksimum ${maxUsers} kullanıcı).`);
        }
    }

    private async issueEmailVerification(user: { id: number; email: string }): Promise<void> {
        const rawToken = randomUUID();
        await this.authTokenRepo.create({
            user_id: user.id,
            token_hash: sha256(rawToken),
            purpose: 'email_verify',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 saat
        });
        await this.mailService.sendVerificationEmail(user.email, rawToken);
    }

    async loginWithGoogle(idToken: string, req: Request): Promise<LoginResult> {
        await this.assertUserQuotaAvailable()
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.email_verified) {
            throw new UnauthorizedException('Google hesabı doğrulanamadı.');
        }

        let user = await this.userService.findByGoogleId(payload.sub);

        if (!user) {
            const existing = await this.userService.findActiveByEmail(payload.email);
            if (existing) {
                // Aynı e-postayla önceden şifreyle kayıt olmuş — Google zaten
                // bu e-postanın sahipliğini doğruladığı için hesabı güvenle bağlıyoruz.
                user = await this.userService.linkGoogleId(existing.id, payload.sub);
            } else {
                const userName = await this.generateUniqueUsername(payload.email);
                user = await this.userService.createFromGoogle({
                    email: payload.email,
                    full_name: payload.name ?? userName,
                    user_name: userName,
                    google_id: payload.sub,
                    avatar_url: payload.picture,
                });
            }
        }

        if (!user) {
            await this.securityEventRepo.log({ event_type: 'login_failed', ...clientInfo(req) })
            throw new UnauthorizedException();
        }

        if (user.is_banned) throw new ForbiddenException("Hesabınız askıya alınmıştır.");

        const session = await this.issueSession(user, req);

        await this.securityEventRepo.log({ event_type: 'login_success', user_id: user.id, email: user.email, ...clientInfo(req) })

        return { user: this.toUserResponse(user as AuthUser), ...session };
    }

    // "kayra.ozgur@gmail.com" -> "kayraozgur", çakışırsa "kayraozgur1", "kayraozgur2"...
    private async generateUniqueUsername(email: string): Promise<string> {
        const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 12) || 'user';
        let candidate = base;
        let suffix = 0;
        while ((await this.userService.existByUserName(candidate)).length > 0) {
            suffix += 1;
            candidate = `${base}${suffix}`;
        }
        return candidate;
    }

    async login(data: LoginRequestDTO, req: Request): Promise<LoginResult> {

        const user = await this.userService.findActiveByEmail(data.email);
        if (!user) {
            await this.securityEventRepo.log({ event_type: 'login_failed', email: data.email, ...clientInfo(req) });
            throw new UnauthorizedException("Email veya şifre hatalı");
        }
        if (user.is_banned) throw new ForbiddenException("Hesabınız askıya alınmıştır");
        const match = await bcrypt.compare(data.password, user.password);
        if (!match) {
            await this.securityEventRepo.log({ event_type: 'login_failed', user_id: user.id, email: data.email, ...clientInfo(req) });
            throw new UnauthorizedException("Email veya şifre hatalı");
        }
        const payload: JwtPayload = { sub: user.id };
        const accessToken: string = this.jwtService.sign(payload);
        const refreshToken = randomUUID();
        const hashedRefreshToken: string = sha256(refreshToken);

        const familyId = randomUUID();

        const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null;
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
        const ipAddress = typeof req.ip === 'string' ? req.ip : 'unknown';

        await this.userSessionRepo.create({
            user_id: user.id,
            family_id: familyId,
            refresh_token_hash: hashedRefreshToken,
            device_id: deviceId,
            user_agent: userAgent,
            ip_address: ipAddress,
            expires_at: this.refreshExpiresAt()
        })

        await this.securityEventRepo.log({ event_type: 'login_success', user_id: user.id, email: user.email, ...clientInfo(req) });

        return { user: this.toUserResponse(user), accessToken: accessToken, refreshToken: refreshToken };
    }

    async register(data: RegisterRequestDTO, req: Request): Promise<RegisterResult> {
        await this.assertUserQuotaAvailable()
        await this.isAvailableForRegister(data);

        const hashedPassword: string = await bcrypt.hash(data.password, 10);
        const user: UserResponse = await this.userService.create({ ...data, password: hashedPassword });

        const payload: JwtPayload = { sub: user.id };
        const accessToken: string = this.jwtService.sign(payload);

        const familyId = randomUUID();
        const refreshToken = randomUUID();
        // const hashedRefreshToken: string = await bcrypt.hash(refreshToken, 10);
        const hashedRefreshToken: string = sha256(refreshToken);

        const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null;
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
        const ipAdress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown';


        await this.userSessionRepo.create({
            user_id: user.id,
            family_id: familyId,
            refresh_token_hash: hashedRefreshToken,
            device_id: deviceId,
            user_agent: userAgent,
            ip_address: ipAdress,
            expires_at: this.refreshExpiresAt()
        })

        await this.issueEmailVerification({ id: user.id, email: user.email });

        return { user: user, accessToken: accessToken, refreshToken: refreshToken };
    }

    private async isAvailableForRegister(data: RegisterRequestDTO) {
        if (containsProfanity(data.user_name)) throw new BadRequestException("Kullanıcı adı uygunsuz içerik barındırıyor.");

        const emailExists: [] = await this.userService.existByEmail(data.email);
        const userNameExists: [] = await this.userService.existByUserName(data.user_name);

        if (emailExists.length !== 0) throw new ConflictException('Bu e-posta kullanılmaktadır!');
        if (userNameExists.length !== 0) throw new ConflictException('Kullanıcı adı zaten kayıtlı!');

        return true;
    }

    private toUserResponse(user: AuthUser): UserResponse {
        return {
            id: user.id,
            user_name: user.user_name,
            email: user.email,
            full_name: user.full_name,
            description: user.description,
            avatar_url: user.avatar_url,
            email_verified: user.email_verified
        };
    }

    async revoke(id: number): Promise<boolean> {
        const revoked: boolean = await this.userSessionRepo.revoke(id);
        if (!revoked) throw new NotFoundException();
        return true;
    }

    async findByRefreshTokenHash(refreshToken: string): Promise<UserSessionResult | null> {
        const hashedRefreshToken: string = sha256(refreshToken);
        const session = await this.userSessionRepo.findByRefreshTokenHash(hashedRefreshToken);
        return session;
    }

    async refresh(refreshToken: string, req: Request): Promise<{ accessToken: string, refreshToken: string }> {
        const hashedIncoming = sha256(refreshToken);
        const session: UserSessionResult | null = await this.userSessionRepo.findByRefreshTokenHash(hashedIncoming);
        if (!session) throw new UnauthorizedException();

        if (session.is_revoked) {
            // Grace penceresi içinde bu hash için bir sonuç ürettiysek,
            // muhtemelen bu eş zamanlı bir yarışın kurbanı — theft değil.
            const cached = this.refreshGraceCache.get(hashedIncoming);
            if (cached && cached.expiresAt > Date.now()) {
                return { accessToken: cached.accessToken, refreshToken: cached.refreshToken };
            }

            await this.securityEventRepo.log({
                event_type: 'refresh_reuse_detected',
                user_id: session.user_id,
                metadata: { family_id: session.family_id },
                ...clientInfo(req)
            });

            await this.userSessionRepo.revokeFamily(session.family_id);
            throw new UnauthorizedException();
        }

        if (session.expires_at < new Date()) throw new UnauthorizedException();

        await this.userSessionRepo.revoke(session.id);

        const newRefreshToken = randomUUID();
        const hashedNewRefreshToken: string = sha256(newRefreshToken);

        const deviceId = typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : null;
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown';

        await this.userSessionRepo.transactionRevokeAndCreate(session.id, {
            user_id: session.user_id,
            family_id: session.family_id,
            refresh_token_hash: hashedNewRefreshToken,
            device_id: deviceId,
            user_agent: userAgent,
            ip_address: ipAddress,
            expires_at: this.refreshExpiresAt(),
        });

        const payload: JwtPayload = { sub: session.user_id };
        const accessToken = this.jwtService.sign(payload);

        // Aynı eski token'la gelecek (yarışan) diğer isteklerin de bu sonucu
        // bulabilmesi için, kısa süreliğine önbelleğe yazıyoruz.
        this.refreshGraceCache.set(hashedIncoming, {
            accessToken,
            refreshToken: newRefreshToken,
            expiresAt: Date.now() + AuthService.GRACE_MS,
        });
        setTimeout(() => this.refreshGraceCache.delete(hashedIncoming), AuthService.GRACE_MS);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async verifyEmail(token: string): Promise<void> {
        const row = await this.authTokenRepo.findValid(sha256(token), 'email_verify');
        if (!row) throw new BadRequestException('Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
        await this.userService.markEmailVerified(row.user_id);
        await this.authTokenRepo.markUsed(row.id);
    }

    async resendVerification(userId: number): Promise<void> {
        const user = await this.userService.findById(userId);
        if (!user) throw new NotFoundException();
        if (user.email_verified) return; // zaten doğrulanmış, yeni mail gönderme
        await this.issueEmailVerification({ id: user.id, email: user.email });
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userService.findActiveByEmail(email);
        if (!user) return; // ENUMERASYON ÖNLEME: kullanıcı yoksa da sessizce başarı
        const rawToken = randomUUID();
        await this.authTokenRepo.create({
            user_id: user.id,
            token_hash: sha256(rawToken),
            purpose: 'password_reset',
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 saat
        });
        await this.mailService.sendPasswordResetEmail(user.email, rawToken);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const row = await this.authTokenRepo.findValid(sha256(token), 'password_reset');
        if (!row) throw new BadRequestException('Sıfırlama bağlantısı geçersiz veya süresi dolmuş.');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.userService.resetPasswordHash(row.user_id, hashed);
        await this.authTokenRepo.markUsed(row.id);
        await this.userSessionRepo.revokeAllForUser(row.user_id); // eski oturumlar düşer
    }

    async logoutAllDevices(userId: number): Promise<void> {
        await this.userSessionRepo.revokeAllForUser(userId); // refresh token'lar düşer
        await this.userService.bumpTokenValidAfter(userId);  // aktif access token'lar da anında geçersiz
    }

    async deleteAccount(userId: number, confirmation: string): Promise<void> {
        const user = await this.userService.findById(userId);
        if (!user) throw new NotFoundException();
        if (user.password) {
            //şifreli hesabı mevcut şifreyle doğrula
            const ok = await bcrypt.compare(confirmation, user.password);
            if (!ok) throw new BadRequestException("Mevcut şifre yanlış");
        }
        else {
            // google hesabı (şifre yok) kullanıcı adıyla doğrulanıyor
            if (confirmation !== user.user_name) throw new BadRequestException('Kullanıcı adı eşleşmiyor');
        }
        await this.userService.softDeleteUser(userId);
        await this.userSessionRepo.revokeAllForUser(userId); // tüm oturumlar düşer
    }
}

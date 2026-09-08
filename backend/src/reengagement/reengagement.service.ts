import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { UserRepository } from 'src/users/repository/user.repository';
import { buildUnsubscribeToken, parseUnsubscribeToken } from 'src/_common/utils/unsubscribe-token';
import {
    REENGAGEMENT_BATCH_LIMIT,
    REENGAGEMENT_COOLDOWN_DAYS,
    REENGAGEMENT_INACTIVE_DAYS,
    REENGAGEMENT_SEND_GAP_MS,
} from './reengagement.constants';

@Injectable()
export class ReengagementService {
    private readonly logger = new Logger(ReengagementService.name);

    constructor(
        private readonly userRepo: UserRepository,
        private readonly mailService: MailService,
        private readonly config: ConfigService,
    ) { }

    private get secret(): string {
        return this.config.get<string>('jwt.JWT_SECRET') ?? '';
    }

    private tokenFor(userId: number): string {
        return buildUnsubscribeToken(userId, this.secret);
    }

    async preview(): Promise<{ eligible: number; inactive_days: number; cooldown_days: number; batch_limit: number }> {
        const eligible = await this.userRepo.countInactiveForReengagement({
            inactiveDays: REENGAGEMENT_INACTIVE_DAYS,
            cooldownDays: REENGAGEMENT_COOLDOWN_DAYS,
        });
        return {
            eligible,
            inactive_days: REENGAGEMENT_INACTIVE_DAYS,
            cooldown_days: REENGAGEMENT_COOLDOWN_DAYS,
            batch_limit: REENGAGEMENT_BATCH_LIMIT,
        };
    }

    async runBatch(): Promise<{ sent: number; failed: number; eligible: number }> {
        const targets = await this.userRepo.findInactiveForReengagement({
            inactiveDays: REENGAGEMENT_INACTIVE_DAYS,
            cooldownDays: REENGAGEMENT_COOLDOWN_DAYS,
            limit: REENGAGEMENT_BATCH_LIMIT,
        });

        const delivered: number[] = [];
        let failed = 0;

        for (const [index, user] of targets.entries()) {
            if (index > 0) await new Promise((r) => setTimeout(r, REENGAGEMENT_SEND_GAP_MS));
            const ok = await this.mailService.sendReengagementEmail(user.email, {
                name: user.full_name,
                unsubscribeToken: this.tokenFor(user.id),
            });
            if (ok) delivered.push(user.id);
            else failed++;
        }

        await this.userRepo.markReengaged(delivered);
        this.logger.log(`Hatırlatma e-postası: ${delivered.length} gönderildi, ${failed} başarısız`);
        return { sent: delivered.length, failed, eligible: targets.length };
    }

    async sendToEmail(rawEmail: string): Promise<{ sent: boolean; matched_user: boolean; opted_out: boolean }> {
        const email = rawEmail.trim().toLowerCase();
        const user = await this.userRepo.findReengagementTargetByEmail(email);

        if (user?.reengagement_opt_out) {
            throw new BadRequestException('REENGAGEMENT_OPTED_OUT');
        }

        const sent = await this.mailService.sendReengagementEmail(user?.email ?? email, {
            name: user?.full_name ?? null,
            unsubscribeToken: user ? this.tokenFor(user.id) : null,
        });

        if (sent && user) await this.userRepo.markReengaged([user.id]);
        if (!sent) throw new BadRequestException('MAIL_SEND_FAILED');

        return { sent, matched_user: !!user, opted_out: false };
    }

    async unsubscribe(token: string): Promise<{ email: string }> {
        const userId = parseUnsubscribeToken(token, this.secret);
        if (!userId) throw new BadRequestException('INVALID_UNSUBSCRIBE_TOKEN');

        const user = await this.userRepo.setReengagementOptOut(userId, true);
        if (!user) throw new BadRequestException('INVALID_UNSUBSCRIBE_TOKEN');

        return { email: user.email };
    }
}

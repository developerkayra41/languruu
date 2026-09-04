import { SecurityEventRepository } from './../auth/repository/security-event.repository';
import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { RegisterRequestDTO } from 'src/auth/dto/request/Register.request.dto';
import { UserResponse } from 'src/_base/base.user.resonse';
import { AuthUser } from 'src/_common/types/auth-user.type';
import { WordRepository } from 'src/words/repository/words.repository';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { clientInfo } from 'src/_common/utils/utils-info';
import { MailService } from 'src/mail/mail.service';
import { AuthTokenRepository } from 'src/auth/repository/auth-token.repository';
import { randomUUID } from 'crypto';
import { sha256 } from 'js-sha256';
import { ConfigService } from '@nestjs/config';
import { DAILY_XP_CAP, levelInfo, XP_PER_WORD, xpFromGameScore } from 'src/_common/utils/xp-level';
@Injectable()
export class UsersService {
  constructor(@Inject(UserRepository) private readonly userRepo: UserRepository,
    @Inject('SUPABASE') private readonly supabase, private readonly wordsRepo: WordRepository,
    private readonly securityEventRepo: SecurityEventRepository,
    private readonly mailService: MailService,
    private readonly authTokenRepo: AuthTokenRepository, private readonly config: ConfigService) { }

  private displayedStreak(
    stats: { study_streak: number; last_study_date: string | null } | null,
  ): number {
    if (!stats || !stats.last_study_date) return 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    return stats.last_study_date === todayStr || stats.last_study_date === yesterdayStr
      ? stats.study_streak
      : 0;
  }

  findActiveByEmail = async (email: string): Promise<AuthUser | null> => this.userRepo.findActiveByEmail(email);

  create = async (data: RegisterRequestDTO): Promise<UserResponse> => this.userRepo.create(data);

  existByEmail = async (email: string) => this.userRepo.existByEmail(email);

  existByUserName = async (userName: string) => this.userRepo.existByUserName(userName);

  getUsersByIds = async (ids: number[]): Promise<{ id: number; full_name: string; user_name: string }[]> => {
    return this.userRepo.getUsersByIds(ids);
  }

  getProfile = async (userId: number) => {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException();


    const wordRow = await this.wordsRepo.getWordsByUserId(userId);
    const totalWords = wordRow
      ? wordRow.words.reduce((sum, c) => sum + (c.wordPool?.length ?? 0), 0)
      : 0;
    const stats = await this.userRepo.getStudyStats(userId);

    return {
      user_name: user.user_name,
      full_name: user.full_name,
      avatar_url: user.avatar_url ? `${user.avatar_url}?v=${user.updated_at?.getTime() ?? Date.now()}` : undefined,
      description: user.description ?? '',
      email: user.email,
      email_verified: user.email_verified,
      has_password: !!user.password,
      is_admin: (this.config.get<string>('app.ADMIN_EMAILS') ?? '')
        .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
        .includes(user.email.toLowerCase()),
      total_words: totalWords,
      word_pool_count: wordRow ? wordRow.words.length : 0,
      daily_streak: this.displayedStreak(stats),
      completed_rounds: stats?.completed_rounds ?? 0,
      game_score: stats?.game_score ?? 0,
      ...levelInfo(stats?.xp),
      needs_discovery_prompt: this.needsDiscoveryPrompt(user),
    };
  };

  private needsDiscoveryPrompt = (user: { discovery_source?: string | null }): boolean => !user.discovery_source;

  setDiscoverySource = async (userId: number, source: string): Promise<{ discovery_source: string }> => {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException();
    if (!user.discovery_source) await this.userRepo.setDiscoverySource(userId, source);
    return { discovery_source: user.discovery_source ?? source };
  };

  countActiveUsers = async (): Promise<number> => this.userRepo.countActiveUsers();

  getPublicProfile = async (userName: string) => {
    const user = await this.userRepo.findByUsernamePublic(userName);
    if (!user) throw new NotFoundException();

    const wordRow = await this.wordsRepo.getWordsByUserId(user.id);
    const totalWords = wordRow
      ? wordRow.words.reduce((sum, c) => sum + (c.wordPool?.length ?? 0), 0)
      : 0;
    const stats = await this.userRepo.getStudyStats(user.id);

    return {
      user_name: user.user_name,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      description: user.description ?? '',
      total_words: totalWords,
      word_pool_count: wordRow ? wordRow.words.length : 0,
      daily_streak: this.displayedStreak(stats),
      completed_rounds: stats?.completed_rounds ?? 0,
      game_score: stats?.game_score ?? 0,
      ...levelInfo(stats?.xp),
    };
  }

  updateProfile = async (userId: number, data: { user_name?: string; full_name?: string; description?: string; avatar_url?: string | null }) => {
    if (data.user_name) {
      const existing = await this.userRepo.findByUsername(data.user_name);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Bu kullanıcı adı zaten kullanılıyor.');
      }
    }
    const payload: { user_name?: string; full_name?: string; description?: string | null; avatar_url?: string | null } = { ...data };
    if (data.full_name !== undefined) payload.full_name = data.full_name.trim();
    if (data.description !== undefined) {
      const trimmed = data.description.trim();
      payload.description = trimmed.length > 0 ? trimmed : null;
    }
    const updated = await this.userRepo.updateProfile(userId, payload);
    if (!updated) throw new NotFoundException();
    return updated;
  };

  updateEmail = async (userId: number, newEmail: string, currentPassword: string) => {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException();

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Mevcut şifre yanlış.');

    const taken = await this.userRepo.existByEmail(newEmail);
    if (taken.length > 0) throw new ConflictException('Bu e-posta zaten kullanılıyor.');

    const updated = await this.userRepo.updateEmail(userId, newEmail); // email_verified=false yapar
    if (!updated) throw new InternalServerErrorException();

    // Yeni adrese doğrulama maili gönder
    const rawToken = randomUUID();
    await this.authTokenRepo.create({
      user_id: userId,
      token_hash: sha256(rawToken),
      purpose: 'email_verify',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.mailService.sendVerificationEmail(newEmail, rawToken);

    return updated;
  };

  updatePassword = async (userId: number, currentPassword: string, newPassword: string) => {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException();

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Mevcut şifre yanlış.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.updatePassword(userId, hashed);
    return { success: true };
  };

  // users.service.ts
  createAvatarUploadUrl = async (userId: number, fileExtension: string) => {
    const filePath = `${userId}/avatar.${fileExtension}`;   // <- artık Date.now() yok, sabit

    const { data, error } = await this.supabase.storage
      .from('avatars')
      .createSignedUploadUrl(filePath, { upsert: true });   // <- upsert: true eklendi

    if (error) throw new InternalServerErrorException(error.message);

    const publicUrl = this.supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;

    return { signedUrl: data.signedUrl, token: data.token, path: filePath, publicUrl };
  };

  deleteAvatar = async (userId: number, req: Request) => {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException();

    if (user.avatar_url) {
      // Path'i URL'den değil, bilinen sabit formülden türetiyoruz —
      // URL'in kendisi (özellikle cache-buster'lı hali) parse etmeye güvenilmez.
      const extension = user.avatar_url.split(".").pop()?.split("?")[0] ?? "jpg";
      const filePath = `${userId}/avatar.${extension}`;

      const { error } = await this.supabase.storage.from('avatars').remove([filePath]);
      if (error) {
        // Storage silme başarısız olsa bile, DB güncellemesini engellemeyelim —
        // kullanıcı için önemli olan "artık fotoğrafım görünmüyor" olması.
        this.securityEventRepo.log({ event_type: 'avatar_not_deleted', user_id: user.id, email: user.email, ...clientInfo(req) })
      }
    }

    const updated = await this.userRepo.updateProfile(userId, { avatar_url: null });
    if (!updated) throw new InternalServerErrorException();
    return updated;
  };

  // users.service.ts
  findByGoogleId = (googleId: string) => this.userRepo.findByGoogleId(googleId);
  linkGoogleId = (userId: number, googleId: string) => this.userRepo.linkGoogleId(userId, googleId);
  createFromGoogle = (data: Parameters<UserRepository['createFromGoogle']>[0]) => this.userRepo.createFromGoogle(data);

  markEmailVerified = async (userId: number): Promise<void> => this.userRepo.markEmailVerified(userId);
  findById = async (userId: number) => this.userRepo.findById(userId);

  resetPasswordHash = async (userId: number, hashed: string): Promise<void> => this.userRepo.updatePassword(userId, hashed);

  softDeleteUser = async (userId: number): Promise<void> => this.userRepo.softDelete(userId);

  bumpTokenValidAfter = async (userId: number): Promise<void> => this.userRepo.bumpTokenValidAfter(userId);

  findUnverifiedBefore = async (date: Date): Promise<{ id: number }[]> => this.userRepo.findUnverifiedBefore(date);

  recordStudyCompletion = async (userId: number): Promise<void> => this.userRepo.recordStudyCompletion(userId);

  awardWordXp = async (userId: number, words: number) => {
    const { xp, gained } = await this.userRepo.awardXp(userId, words * XP_PER_WORD, DAILY_XP_CAP);
    return { ...levelInfo(xp), gained };
  };

  awardGameXp = async (userId: number, score: number): Promise<void> => {
    const amount = xpFromGameScore(score);
    if (amount <= 0) return;
    await this.userRepo.awardXp(userId, amount, DAILY_XP_CAP);
  };
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendRepository } from './repository/friend.repository';
import { UserRepository } from 'src/users/repository/user.repository';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RelationStatus } from 'src/_common/types/social.type';

@Injectable()
export class FriendsService {
    constructor(
        private readonly friendRepo: FriendRepository,
        private readonly userRepo: UserRepository,
        private readonly notificationsService: NotificationsService,
    ) { }

    private resolveTarget = async (userName: string) => {
        const target = await this.userRepo.findByUsernamePublic(userName);
        if (!target) throw new NotFoundException('Kullanıcı bulunamadı.');
        return target;
    };

    getStatus = async (userId: number, userName: string): Promise<{ status: RelationStatus; request_id: number | null }> => {
        const target = await this.resolveTarget(userName);
        if (target.id === userId) return { status: 'self', request_id: null };

        const relation = await this.friendRepo.findRelation(userId, target.id);
        if (!relation) return { status: 'none', request_id: null };
        if (relation.status === 'accepted') return { status: 'friends', request_id: null };

        return relation.requester_id === userId
            ? { status: 'pending_outgoing', request_id: relation.id }
            : { status: 'pending_incoming', request_id: relation.id };
    };

    sendRequest = async (userId: number, userName: string): Promise<{ status: RelationStatus; request_id: number | null }> => {
        const target = await this.resolveTarget(userName);
        if (target.id === userId) throw new BadRequestException('Kendinize arkadaşlık isteği gönderemezsiniz.');

        const relation = await this.friendRepo.findRelation(userId, target.id);
        if (relation) {
            if (relation.status === 'accepted') throw new BadRequestException('Zaten arkadaşsınız.');
            if (relation.requester_id === userId) throw new BadRequestException('Arkadaşlık isteğiniz zaten beklemede.');
            return this.respond(userId, relation.id, 'accept');
        }

        const created = await this.friendRepo.createRequest(userId, target.id);
        await this.notificationsService.create({
            user_id: target.id,
            actor_user_id: userId,
            type: 'friend_request',
            payload: { request_id: created.id },
        });

        return { status: 'pending_outgoing', request_id: created.id };
    };

    respond = async (userId: number, requestId: number, action: 'accept' | 'reject'): Promise<{ status: RelationStatus; request_id: number | null }> => {
        const relation = await this.friendRepo.findById(requestId);
        if (!relation || relation.addressee_id !== userId) throw new NotFoundException('İstek bulunamadı.');
        if (relation.status !== 'pending') throw new BadRequestException('Bu istek zaten yanıtlanmış.');

        await this.notificationsService.consumeFriendRequest(requestId);

        if (action === 'reject') {
            await this.friendRepo.remove(relation.id);
            return { status: 'none', request_id: null };
        }

        await this.friendRepo.accept(relation.id);
        await this.notificationsService.create({
            user_id: relation.requester_id,
            actor_user_id: userId,
            type: 'friend_accepted',
        });

        return { status: 'friends', request_id: null };
    };

    cancelRequest = async (userId: number, userName: string): Promise<{ status: RelationStatus; request_id: null }> => {
        const target = await this.resolveTarget(userName);
        const relation = await this.friendRepo.findRelation(userId, target.id);
        if (!relation || relation.status !== 'pending' || relation.requester_id !== userId) {
            throw new NotFoundException('İptal edilecek bir istek yok.');
        }

        await this.notificationsService.consumeFriendRequest(relation.id);
        await this.friendRepo.remove(relation.id);
        return { status: 'none', request_id: null };
    };

    removeFriend = async (userId: number, userName: string): Promise<{ status: RelationStatus; request_id: null }> => {
        const target = await this.resolveTarget(userName);
        const relation = await this.friendRepo.findRelation(userId, target.id);
        if (!relation || relation.status !== 'accepted') throw new NotFoundException('Bu kullanıcı arkadaşınız değil.');

        await this.friendRepo.remove(relation.id);
        await this.notificationsService.clearPair(userId, target.id);
        return { status: 'none', request_id: null };
    };

    listFriends = async (userId: number) => this.friendRepo.listFriends(userId);

    listRequests = async (userId: number) => this.friendRepo.listIncomingRequests(userId);

    summary = async (userId: number) => {
        const [friendCount, requestCount] = await Promise.all([
            this.friendRepo.countFriends(userId),
            this.friendRepo.countIncomingRequests(userId),
        ]);
        return { friend_count: friendCount, pending_request_count: requestCount };
    };
}

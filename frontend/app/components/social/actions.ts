"use server";

import {
  cancelFriendRequest,
  getFriendRequests,
  getFriendStatus,
  getFriends,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  getConversations,
  getUnreadMessageSenders,
  getMessageThread,
  sendMessage,
  editMessage,
  deleteMessage,
} from "@/app/lib/api-client";
import type {
  ConversationSummary,
  FriendRelation,
  FriendRequestSummary,
  FriendSummary,
  MessageItem,
  MessageThread,
  NotificationsPage,
} from "@/app/types/social";

type Result<T> = { success: true; data: T } | { success: false; error: string };

async function run<T>(fn: () => Promise<T>, fallback: string): Promise<Result<T>> {
  try {
    return { success: true as const, data: await fn() };
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && typeof (err as { digest?: unknown }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { success: false as const, error: err instanceof Error ? err.message : fallback };
  }
}

export async function loadNotificationsAction(params?: { limit?: number; offset?: number }): Promise<Result<NotificationsPage>> {
  return run(() => getNotifications(params), "Bildirimler yüklenemedi");
}

export async function loadUnreadCountAction(): Promise<Result<{ count: number }>> {
  return run(() => getUnreadNotificationCount(), "Bildirim sayısı alınamadı");
}

export async function markNotificationReadAction(id: number): Promise<Result<{ count: number }>> {
  return run(() => markNotificationRead(id), "Bildirim işaretlenemedi");
}

export async function markAllNotificationsReadAction(): Promise<Result<{ count: number }>> {
  return run(() => markAllNotificationsRead(), "Bildirimler işaretlenemedi");
}

export async function friendStatusAction(userName: string): Promise<Result<FriendRelation>> {
  return run(() => getFriendStatus(userName), "Arkadaşlık durumu alınamadı");
}

export async function sendFriendRequestAction(userName: string): Promise<Result<FriendRelation>> {
  return run(() => sendFriendRequest(userName), "İstek gönderilemedi");
}

export async function respondFriendRequestAction(requestId: number, action: "accept" | "reject"): Promise<Result<FriendRelation>> {
  return run(() => respondFriendRequest(requestId, action), "İstek yanıtlanamadı");
}

export async function cancelFriendRequestAction(userName: string): Promise<Result<FriendRelation>> {
  return run(() => cancelFriendRequest(userName), "İstek geri çekilemedi");
}

export async function removeFriendAction(userName: string): Promise<Result<FriendRelation>> {
  return run(() => removeFriend(userName), "Arkadaşlık kaldırılamadı");
}

export async function loadFriendsAction(): Promise<Result<FriendSummary[]>> {
  return run(() => getFriends(), "Arkadaş listesi alınamadı");
}

export async function loadFriendRequestsAction(): Promise<Result<FriendRequestSummary[]>> {
  return run(() => getFriendRequests(), "İstekler alınamadı");
}

export async function loadConversationsAction(): Promise<Result<ConversationSummary[]>> {
  return run(() => getConversations(), "Mesajlar yüklenemedi");
}

export async function loadThreadAction(userName: string): Promise<Result<MessageThread>> {
  return run(() => getMessageThread(userName), "Yazışma yüklenemedi");
}

export async function sendMessageAction(userName: string, body: string): Promise<Result<MessageItem>> {
  return run(() => sendMessage(userName, body), "Mesaj gönderilemedi");
}

export async function editMessageAction(id: number, body: string): Promise<Result<MessageItem>> {
  return run(() => editMessage(id, body), "Mesaj düzenlenemedi");
}

export async function deleteMessageAction(id: number): Promise<Result<{ id: number }>> {
  return run(() => deleteMessage(id), "Mesaj silinemedi");
}

export async function loadUnreadMessagesAction(): Promise<Result<{ unread_senders: number }>> {
  return run(() => getUnreadMessageSenders(), "Mesaj sayısı alınamadı");
}

export type RelationStatus = "none" | "self" | "friends" | "pending_outgoing" | "pending_incoming";

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "group_copied"
  | "message_received";

export interface NotificationPayload {
  request_id?: number;
  group_name?: string;
  share_id?: string;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  payload: NotificationPayload | null;
  read_at: string | null;
  created_at: string;
  actor_user_name: string | null;
  actor_full_name: string | null;
  actor_avatar_url: string | null;
}

export interface NotificationsPage {
  items: NotificationItem[];
  unread_count: number;
  has_more: boolean;
}

export interface FriendSummary {
  id: number;
  user_name: string;
  full_name: string;
  avatar_url: string | null;
  friends_since: string | null;
}

export interface FriendRequestSummary {
  request_id: number;
  user_name: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface FriendRelation {
  status: RelationStatus;
  request_id: number | null;
}

export interface FriendCounts {
  friend_count: number;
  pending_request_count: number;
}

export interface ConversationSummary {
  conversation_id: number;
  user_name: string;
  full_name: string;
  avatar_url: string | null;
  last_body: string;
  last_message_at: string;
  last_from_me: boolean;
  unread: boolean;
}

export interface MessageItem {
  id: number;
  body: string;
  created_at: string;
  edited_at: string | null;
  from_me: boolean;
}

export interface MessageThread {
  peer: {
    user_name: string;
    full_name: string;
    avatar_url: string | null;
  };
  messages: MessageItem[];
  expires_in_days: number;
}

export interface GlobalMessageItem {
  id: number;
  body: string;
  created_at: string;
  edited_at: string | null;
  from_me: boolean;
  user_name: string;
  full_name: string;
  avatar_url: string | null;
}

export interface GlobalChatFeed {
  messages: GlobalMessageItem[];
  expires_in_days: number;
  is_moderator: boolean;
}

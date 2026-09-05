import { getFriendRequests, getFriends, getNotifications } from "@/app/lib/api-client";
import NotificationsClient from "./NotificationsClient";

interface NotificationsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const { tab } = await searchParams;
  const [page, requests, friends] = await Promise.all([
    getNotifications({ limit: 30 }),
    getFriendRequests(),
    getFriends(),
  ]);

  return (
    <NotificationsClient
      initialTab={tab === "requests" || tab === "friends" ? tab : undefined}
      initialNotifications={page.items}
      initialRequests={requests}
      initialFriends={friends}
    />
  );
}

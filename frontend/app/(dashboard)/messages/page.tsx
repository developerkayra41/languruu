import { getConversations } from "@/app/lib/api-client";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const conversations = await getConversations();
  return <MessagesClient initialConversations={conversations} />;
}

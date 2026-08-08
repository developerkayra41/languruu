// app/(dashboard)/words/page.tsx
import { cookies } from "next/headers";
import EmptyGroupState from "../study/EmptyGroupState";
import WordsClient from "./WordsClient";
import { getWordsByWordId, getWordsInfo } from "@/app/lib/api-client";

const ACTIVE_GROUP_COOKIE = "activeGroupId";

export default async function Words() {
  const groups = await getWordsInfo();

  if (groups.length === 0) return <EmptyGroupState />;

  const cookieStore = await cookies();
  const storedId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;
  const storedIdAsNumber = storedId ? Number(storedId) : null;
  const targetGroup = groups.find((g) => g.id === storedIdAsNumber) ?? groups[0];
  const fullGroup = await getWordsByWordId(targetGroup.id);

  return <WordsClient group={fullGroup} />;
}
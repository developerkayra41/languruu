import { getWordsByWordId, getWordsInfo } from "@/app/lib/api-client";
import StudyClient from "./StudyClient";
import { cookies } from "next/headers";
import EmptyGroupState from "./EmptyGroupState";
import EmptyWordsState from "@/app/components/study/EmptyWordsState";

const ACTIVE_GROUP_COOKIE = "activeGroupId";

export default async function StudyPage() {
  const groups = await getWordsInfo();

  if (groups.length === 0) return <EmptyGroupState />;

  const cookieStore = await cookies();
  const storedId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;
  const storedIdAsNumber = storedId ? Number(storedId) : null;
  const targetGroup = groups.find((g) => g.id === storedIdAsNumber) ?? groups[0];
  const fullGroup = await getWordsByWordId(targetGroup.id);

  if (fullGroup.wordPool.length === 0) {
    return <EmptyWordsState groupName={fullGroup.name} />;
  }

  return <StudyClient group={fullGroup} />;
}

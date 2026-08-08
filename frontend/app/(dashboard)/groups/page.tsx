import { getWordsInfo } from "@/app/lib/api-client";
import GroupsClient from "./GroupsClient";


export default async function GroupsPage() {
  const groups = await getWordsInfo();
  return <GroupsClient groups={groups} />;
}
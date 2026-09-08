import { cookies } from "next/headers";
import EmptyGroupState from "../study/EmptyGroupState";
import AddClient from "./AddClient";
import SongAddClient from "./SongAddClient";
import { getWordsByWordId, getWordsInfo } from "@/app/lib/api-client";

const ACTIVE_GROUP_COOKIE = 'activeGroupId'
export default async function Add() {
 
        const groups = await getWordsInfo();
    
        if (groups.length === 0) return <EmptyGroupState />
    
        const cookieStore = await cookies();
        const storedId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;
        const storedIdAsNumber = storedId ? Number(storedId) : null;
        const targetGroup = groups.find((g) => g.id === storedIdAsNumber) ?? groups[0];
        const fullGroup = await getWordsByWordId(targetGroup.id);
    
        if (fullGroup.isSong) return <SongAddClient group={fullGroup} />;

        return <AddClient group={fullGroup} />;

}
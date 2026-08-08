"use server";

import { revalidatePath } from "next/cache";
import { copyMarketplaceEntry as copyEntry } from "@/app/lib/api-client";
import { WordColumn } from "@/app/types/word";
import { PoolDetail } from "@/app/types/marketplace";
import { getPoolDetail as fetchPoolDetail } from "@/app/lib/api-client";
import { unshareMarketplaceEntry as unshareEntry } from "@/app/lib/api-client";


type CopyResult = { success: true; data: WordColumn } | { success: false; error: string };
type UnshareResult = { success: true } | { success: false; error: string };

type PoolDetailResult =
  | { success: true; data: PoolDetail }
  | { success: false; error: string };

export async function copyMarketplaceEntry(shareId: string): Promise<CopyResult> {
  try {
    const data = await copyEntry(shareId);
    revalidatePath("/groups");
    revalidatePath("/study");
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Kopyalama sırasında hata oluştu",
    };
  }
}

export async function getPoolDetail(shareId: string): Promise<PoolDetailResult> {
  try {
    const data = await fetchPoolDetail(shareId);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Havuz detayları alınamadı",
    };
  }
}   

export async function unshareMarketplaceEntry(shareId: string): Promise<UnshareResult> {
  try {
    await unshareEntry(shareId);
    revalidatePath("/marketplace");
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Kaldırma işlemi başarısız oldu",
    };
  }
}
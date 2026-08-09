"use server";
import { deleteAvatar as deleteAvatarApi } from "@/app/lib/api-client";
import { getAvatarUploadUrl, updateProfile as updateProfileApi } from "@/app/lib/api-client";

export async function requestAvatarUploadUrl(extension: string) {
  try {
    const data = await getAvatarUploadUrl(extension);
    return { success: true as const, data };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Yükleme başlatılamadı" };
  }
}

export async function saveProfile(data: { user_name?: string; avatar_url?: string }) {
  try {
    const result = await updateProfileApi(data);
    return { success: true as const, data: result };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Profil güncellenemedi" };
  }
}

export async function deleteAvatar() {
  try {
    const result = await deleteAvatarApi();
    return { success: true as const, data: result };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Fotoğraf silinemedi",
    };
  }
}
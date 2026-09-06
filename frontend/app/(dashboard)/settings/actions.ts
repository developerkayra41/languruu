"use server";
import { deleteAccount, logoutAllDevices, updateEmail, updatePassword, updatePresenceVisibility } from "@/app/lib/api-client";
import type { PresenceVisibility } from "@/app/types/social";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function updateEmailAction(newEmail: string, currentPassword: string) {
  try {
    await updateEmail(newEmail, currentPassword);
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "E-posta güncellenemedi." };
  }
}

export async function updatePasswordAction(currentPassword: string, newPassword: string) {
  try {
    await updatePassword(currentPassword, newPassword);
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Şifre güncellenemedi." };
  }
}

export async function updatePresenceVisibilityAction(visibility: PresenceVisibility) {
  try {
    await updatePresenceVisibility(visibility);
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Ayar güncellenemedi." };
  }
}

export async function logoutAllAction() {
  try {
    await logoutAllDevices();
  } catch {
  }
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect("/login");
}

export async function deleteAccountAction(password: string) {
  try {
    await deleteAccount(password);
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Hesap silinemedi." };
  }
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect("/login");
}
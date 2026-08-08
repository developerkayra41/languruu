// app/(dashboard)/actions.ts (ya da uygun bir yer)
"use server";
import { buildRefreshCookieHeader } from "@/app/lib/auth-utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resendVerification } from "@/app/lib/api-client"; // dosya başına

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: buildRefreshCookieHeader(refreshToken) },
    }).catch(() => { });
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect("/login");
}


export async function resendVerificationAction() {
  try {
    await resendVerification();
    return { success: true as const };
  } catch (e: any) {
    return { success: false as const, error: e?.message ?? "Gönderilemedi." };
  }
}
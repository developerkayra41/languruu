"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { googleAuthRequest, loginRequest } from "@/app/lib/api-client";
import { extractCookieValue } from "@/app/lib/auth-utils";

export async function login(identifier: string, password: string) {
  const res = await loginRequest(identifier, password);
  let json: any = null;
  try { json = await res.json(); } catch { }

  if (!res.ok) {
    return { success: false as const, error: json?.message ?? "Giriş başarısız" };
  }

  const { accessToken } = json.data;
  const refreshToken = extractCookieValue(res.headers.get("set-cookie"), "refresh_token");

  const isProduction = process.env.NODE_ENV === "production";

  const cookieStore = await cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 15,
  });
  if (refreshToken) {
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
  }

  redirect("/study");
}

export async function loginWithGoogle(idToken: string) {
  const res = await googleAuthRequest(idToken);
  let json: any = null;
  try { json = await res.json(); } catch {}

  if (!res.ok) {
    return { success: false as const, error: json?.message ?? "Google ile giriş başarısız" };
  }

  const { accessToken } = json.data;
  const refreshToken = extractCookieValue(res.headers.get("set-cookie"), "refresh_token");
  const isProduction = process.env.NODE_ENV === "production";

  const cookieStore = await cookies();
  cookieStore.set("access_token", accessToken, {
    httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 15,
  });
  if (refreshToken) {
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
  }

  redirect("/study");
}
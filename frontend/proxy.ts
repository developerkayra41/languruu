import { NextRequest, NextResponse } from "next/server";
import { isTokenExpiringSoon, extractCookieValue, buildRefreshCookieHeader } from "@/app/lib/auth-utils";

const PROTECTED_PREFIXES = [
  "/study", "/words", "/add", "/groups", "/marketplace",
  "/settings", "/profile", "/top-performers", "/admin", "/users", "/suspended",
];
const AUTH_ONLY_PATHS = ["/login", "/register"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function proxy(req: NextRequest) {
  const isPrefetch = req.headers.get("next-router-prefetch") === "1";
  if (isPrefetch) {
    return NextResponse.next(); // prefetch isteklerinde auth kontrolü atlanıyor, gerçek navigasyon zaten yapacak
  }

  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (accessToken && !isTokenExpiringSoon(accessToken)) {
      return NextResponse.redirect(new URL("/study", req.url));
    }
    return NextResponse.next();
  }

  // Yalnızca bilinen uygulama rotaları korunur. Tanınmayan yollar Next.js'e
  // düşer ve gerçek 404 döner — aksi halde her yanlış URL /login'e yönlenip
  // Google'a "bu sayfa var ama yönlendiriliyor" sinyali veriyordu.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!accessToken || isTokenExpiringSoon(accessToken)) {
    if (!refreshToken) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { Cookie: buildRefreshCookieHeader(refreshToken) },
        signal: AbortSignal.timeout(5000), // backend 5sn'de yanıt vermezse iptal et
      });
      if (!res.ok) throw new Error("refresh failed");

      const json = await res.json();
      const newAccessToken = json.data.accessToken;
      const newRefreshToken = extractCookieValue(res.headers.get("set-cookie"), "refresh_token");

      // KRİTİK: isteğin KENDİ cookie jar'ını da güncelliyoruz — bu request'in
      // devamındaki Server Component'ler artık ESKİ değil, YENİ token'ı görecek.
      req.cookies.set("access_token", newAccessToken);
      if (newRefreshToken) req.cookies.set("refresh_token", newRefreshToken);

      const response = NextResponse.next({ request: req });
      const isProduction = process.env.NODE_ENV === "production";

      // Tarayıcının GELECEKTEKİ istekler için de bu değerleri saklamasını sağlıyoruz.
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 15,
      });
      if (newRefreshToken) {
        response.cookies.set("refresh_token", newRefreshToken, {
          httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
        });
      }
      return response;
    } catch {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|icon.svg|apple-icon|opengraph-image).*)",
  ],
};

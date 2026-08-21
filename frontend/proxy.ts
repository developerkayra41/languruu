import { NextRequest, NextResponse } from "next/server";
import { isTokenExpiringSoon, extractCookieValue, buildRefreshCookieHeader } from "@/app/lib/auth-utils";
import { Locale, LOCALE_HEADER } from "@/app/i18n/locales";

const PROTECTED_PREFIXES = [
  "/study", "/words", "/add", "/groups", "/marketplace",
  "/settings", "/profile", "/top-performers", "/admin", "/users", "/suspended",
];
const AUTH_ONLY_PATHS = ["/login", "/register"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Pazarlama sayfalarinda dili URL belirler. Cerezi olmayan ziyaretci ve
// botlar / adresini Turkce, /en adresini Ingilizce gorur; boylece Google her
// adresi sabit tek bir dilde indeksler.
// Secilen dil ayrica cereze yazilir: layout client-side gecislerde yeniden
// render edilmedigi icin, dil sayfadan sayfaya degisirse sunucu ve istemci
// metinleri karisir (yari Turkce yari Ingilizce ekran).
function forcedLocaleFor(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/" || pathname === "/blog" || pathname.startsWith("/blog/")) return "tr";
  if (pathname === "/privacy" || pathname === "/terms") return "tr";
  return null;
}

const LOCALE_PAIR_PATHS = new Set(["/", "/en"]);
const LANDING_PATHS = new Set(["/", "/en"]);

function passThrough(req: NextRequest, pathname: string) {
  const cookieLocale = req.cookies.get("locale")?.value;
  const locale = forcedLocaleFor(pathname);
  if (!locale) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (LOCALE_PAIR_PATHS.has(pathname) && cookieLocale !== locale) {
    response.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPrefetch = req.headers.get("next-router-prefetch") === "1";
  if (isPrefetch) {
    return passThrough(req, pathname); // prefetch isteklerinde auth kontrolü atlanıyor, gerçek navigasyon zaten yapacak
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Giris yapmis kullaniciyi pazarlama sayfalarinda tutmanin anlami yok.
  // Googlebot'un cerezi olmadigi icin o landing'i 200 olarak gormeye devam eder.
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const isLanding = LANDING_PATHS.has(pathname);

  if (isAuthOnly || isLanding) {
    if (accessToken && !isTokenExpiringSoon(accessToken)) {
      return NextResponse.redirect(new URL("/study", req.url));
    }
    return passThrough(req, pathname);
  }

  // Yalnızca bilinen uygulama rotaları korunur. Tanınmayan yollar Next.js'e
  // düşer ve gerçek 404 döner — aksi halde her yanlış URL /login'e yönlenip
  // Google'a "bu sayfa var ama yönlendiriliyor" sinyali veriyordu.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return passThrough(req, pathname);

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

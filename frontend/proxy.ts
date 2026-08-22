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

type RefreshOutcome =
  | { status: "ok"; accessToken: string; refreshToken: string | null }
  | { status: "invalid" }
  | { status: "unavailable" };

// Backend'e refresh isteği. "invalid" = refresh token gerçekten geçersiz
// (oturum kapatılmalı). "unavailable" = ağ/timeout/5xx — bu geçici bir durum,
// kullanıcının cookie'leri SİLİNMEZ, bir sonraki istekte tekrar denenir.
async function requestRefresh(refreshToken: string): Promise<RefreshOutcome> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: buildRefreshCookieHeader(refreshToken) },
      signal: AbortSignal.timeout(10000), // Render cold start payı
    });

    if (res.status === 401 || res.status === 403) return { status: "invalid" };
    if (!res.ok) return { status: "unavailable" };

    const json = await res.json();
    const accessToken = json?.data?.accessToken;
    if (!accessToken) return { status: "unavailable" };

    return {
      status: "ok",
      accessToken,
      refreshToken: extractCookieValue(res.headers.get("set-cookie"), "refresh_token"),
    };
  } catch {
    return { status: "unavailable" };
  }
}

function applySessionCookies(response: NextResponse, accessToken: string, refreshToken: string | null) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("access_token", accessToken, {
    httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 15,
  });
  if (refreshToken) {
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

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

    // Access token 15 dakikada ölüyor; refresh token 30 gün yaşıyor. Burada
    // refresh denenmezse kullanici 15 dk sonra languruu.com'a girdiginde
    // oturumu duruyorken landing sayfasini gorup "cikis yapmisim" saniyor.
    if (refreshToken) {
      const refreshed = await requestRefresh(refreshToken);
      if (refreshed.status === "ok") {
        const response = NextResponse.redirect(new URL("/study", req.url));
        return applySessionCookies(response, refreshed.accessToken, refreshed.refreshToken);
      }
      if (refreshed.status === "invalid") {
        return clearSessionCookies(passThrough(req, pathname));
      }
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

    const refreshed = await requestRefresh(refreshToken);

    if (refreshed.status === "invalid") {
      return clearSessionCookies(NextResponse.redirect(new URL("/login", req.url)));
    }

    // Backend'e ulaşılamadı (cold start, timeout, 5xx). Oturum hâlâ geçerli
    // olabilir — cookie'leri SİLMİYORUZ ki kullanıcı bir sonraki denemede
    // kaldığı yerden devam edebilsin.
    if (refreshed.status === "unavailable") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // KRİTİK: isteğin KENDİ cookie jar'ını da güncelliyoruz — bu request'in
    // devamındaki Server Component'ler artık ESKİ değil, YENİ token'ı görecek.
    req.cookies.set("access_token", refreshed.accessToken);
    if (refreshed.refreshToken) req.cookies.set("refresh_token", refreshed.refreshToken);

    // Tarayıcının GELECEKTEKİ istekler için de bu değerleri saklamasını sağlıyoruz.
    return applySessionCookies(
      NextResponse.next({ request: req }),
      refreshed.accessToken,
      refreshed.refreshToken,
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|icon.svg|apple-icon|opengraph-image).*)",
  ],
};

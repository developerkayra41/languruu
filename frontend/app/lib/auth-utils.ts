export function isTokenExpiringSoon(token: string, bufferMs = 60_000): boolean {
  try {
    const payloadBase64 = token.split(".")[1];
    const json = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return payload.exp * 1000 - Date.now() < bufferMs;
  } catch {
    return true;
  }
}

export function extractCookieValue(setCookieHeader: string | null, name: string): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildRefreshCookieHeader(refreshToken: string): string {
  return `refresh_token=${encodeURIComponent(refreshToken)}`;
}
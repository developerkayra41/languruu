"use server";

import { cookies } from "next/headers";

// Seçilen temayı cookie'ye yazar; layout bir sonraki render'da <html>'e
// "dark" sınıfını buradan okuyarak koyar (SSR'da, flash olmadan).
export async function setTheme(theme: "dark" | "light") {
  (await cookies()).set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 yıl
  });
}

"use server";

import { cookies } from "next/headers";

export async function setTheme(theme: "dark" | "light") {
  (await cookies()).set("theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

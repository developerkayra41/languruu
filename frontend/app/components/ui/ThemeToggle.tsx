"use client";

import { useEffect, useState } from "react";
import { setTheme } from "@/app/theme/actions";

export default function ThemeToggle() {
  // Başlangıçta (SSR + ilk render) temayı bilmiyoruz; mount'ta <html>'den okuyoruz.
  // Böylece hydration uyuşmazlığı olmaz.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    // Anında görsel geri bildirim
    document.documentElement.classList.toggle("dark", next);
    // Kalıcılık: cookie'ye yaz (fire-and-forget)
    setTheme(next ? "dark" : "light");
  };

  // dark === null iken nötr bir ikon göster (mount öncesi kısa an)
  const icon =
    dark === null ? "fa-circle-half-stroke" : dark ? "fa-sun" : "fa-moon";

  return (
    <button
      onClick={toggle}
      aria-label="Tema değiştir"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition cursor-pointer"
    >
      <i className={`fas ${icon}`}></i>
    </button>
  );
}

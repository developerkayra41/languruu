"use client";

import { useEffect, useState } from "react";
import { setTheme } from "@/app/theme/actions";

const NAVBAR_CLASS =
  "flex items-center justify-center w-9 h-9 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition cursor-pointer";

export default function ThemeToggle({ className = NAVBAR_CLASS }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    setTheme(next ? "dark" : "light");
  };

  const icon =
    dark === null ? "fa-circle-half-stroke" : dark ? "fa-sun" : "fa-moon";

  return (
    <button
      onClick={toggle}
      aria-label="Tema değiştir"
      className={className}
    >
      <i className={`fas ${icon}`}></i>
    </button>
  );
}

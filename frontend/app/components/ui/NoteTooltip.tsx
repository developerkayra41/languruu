"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface NoteTooltipProps {
  note: string;
  size?: "sm" | "md";
}

export default function NoteTooltip({ note, size = "sm" }: NoteTooltipProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pointerRef = useRef("");

  const show = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    setOpen(true);
  };

  const hide = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [note]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const sizeClass =
    size === "md" ? "w-7 h-7 text-sm" : "w-5 h-5 text-[0.65rem]";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("note")}
        onPointerEnter={(e) => {
          pointerRef.current = e.pointerType;
          if (e.pointerType === "mouse") show();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") hide();
        }}
        onFocus={show}
        onBlur={hide}
        onClick={() => {
          if (pointerRef.current === "mouse") return;
          if (open) hide();
          else show();
        }}
        className={`${sizeClass} shrink-0 rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50 hover:text-purple-700 inline-flex items-center justify-center transition-colors cursor-pointer`}
      >
        <i className="fas fa-info"></i>
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed -translate-x-1/2 w-56 max-w-[70vw] bg-gray-800 text-white text-sm font-normal leading-snug rounded-lg px-3 py-2 shadow-lg z-[90] text-center pointer-events-none"
          >
            {note}
          </div>,
          document.body,
        )}
    </>
  );
}

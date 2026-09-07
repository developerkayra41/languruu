"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { hiResAvatarUrl } from "@/app/lib/avatar";

interface AvatarLightboxProps {
  src?: string | null;
  alt: string;
  className?: string;
  children: ReactNode;
}

export default function AvatarLightbox({ src, alt, className = "", children }: AvatarLightboxProps) {
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoaded(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    if (!window.history.state?.avatarLightbox) {
      window.history.pushState({ ...window.history.state, avatarLightbox: true }, "");
    }
    const handlePop = () => setIsOpen(false);
    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("popstate", handlePop);
      if (window.history.state?.avatarLightbox) window.history.back();
    };
  }, [isOpen]);

  if (!src) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={t("viewPhoto")}
        aria-label={t("viewPhoto")}
        className={`block cursor-zoom-in rounded-full transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
      >
        {children}
      </button>

      {isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={close}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 fade-enter"
          >
            <button
              type="button"
              onClick={close}
              title={t("close")}
              aria-label={t("close")}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            >
              <i className="fas fa-times text-lg"></i>
            </button>

            <div className="relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {!isLoaded && (
                <span className="absolute inset-0 flex items-center justify-center text-white/70">
                  <i className="fas fa-spinner fa-spin text-2xl"></i>
                </span>
              )}
              <Image
                src={hiResAvatarUrl(src)}
                alt={alt}
                width={1024}
                height={1024}
                unoptimized
                priority
                draggable={false}
                onLoad={() => setIsLoaded(true)}
                className={`w-auto h-auto max-h-[85vh] max-w-[min(90vw,34rem)] rounded-2xl object-contain shadow-2xl transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

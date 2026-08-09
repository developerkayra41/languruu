"use client";

import { useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loginWithGoogle } from "@/app/(auth)/login/actions";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  onError?: (errorMessage: string) => void;
}

export default function GoogleSignInButton({
  onError,
}: GoogleSignInButtonProps) {
  const t = useTranslations("googleButton");
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let attempts = 0;

    const tryInit = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            startTransition(async () => {
              const result = await loginWithGoogle(response.credential);
              if (result && !result.success) onError?.(result.error);
            });
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      } else if (attempts < 20) {
        attempts++;
        setTimeout(tryInit, 150);
      }
    };

    tryInit();
  }, []);

  return (
    <div>
      <div
        ref={buttonRef}
        className={isPending ? "opacity-50 pointer-events-none" : ""}
      />
      {isPending && (
        <p className="text-sm text-gray-400 mt-2 text-center">
          {t("signingIn")}
        </p>
      )}
    </div>
  );
}

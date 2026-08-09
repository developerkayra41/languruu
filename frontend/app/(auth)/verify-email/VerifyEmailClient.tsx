"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { verifyEmailAction } from "./actions";

export default function VerifyEmailClient({ token }: { token: string }) {
  const t = useTranslations("auth.verify");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmailAction(token).then((r) =>
      setStatus(r.success ? "success" : "error"),
    );
  }, [token]);

  return (
    <div className="items-center justify-center bg-[#c27eff]">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-sm w-full text-center">
          {status === "loading" && (
            <p className="text-gray-500">{t("loading")}</p>
          )}
          {status === "success" && (
            <>
              <div className="text-green-500 text-4xl mb-3">
                <i className="fas fa-check-circle"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                {t("successTitle")}
              </h1>
              <p className="text-gray-500 mb-4">{t("successText")}</p>
              <Link
                href="/study"
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {t("continue")}
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div className="text-red-500 text-4xl mb-3">
                <i className="fas fa-times-circle"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                {t("errorTitle")}
              </h1>
              <p className="text-gray-500 mb-4">{t("errorText")}</p>
              <Link
                href="/study"
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {t("goToApp")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

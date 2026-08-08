"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

/**
 * Native `confirm()` yerine tema-uyumlu, promise-tabanlı onay modalı.
 * Kullanım:
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ message: "...", danger: true }))) return;
 *   ...
 *   return <>{confirmDialog} ...</>;
 */
export function useConfirm() {
  const t = useTranslations("common");
  const [state, setState] = useState<{ open: boolean; opts: ConfirmOptions }>({
    open: false,
    opts: { message: "" },
  });
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setState({ open: true, opts });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(result);
    resolver.current = null;
  };

  const { opts } = state;
  const confirmDialog =
    state.open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4"
            onClick={() => settle(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {opts.title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {opts.title}
                </h3>
              )}
              <p className="text-sm text-gray-600 mb-5">{opts.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => settle(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {opts.cancelText ?? t("cancel")}
                </button>
                <button
                  onClick={() => settle(true)}
                  className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                    opts.danger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {opts.confirmText ?? t("confirm")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return { confirm, confirmDialog };
}

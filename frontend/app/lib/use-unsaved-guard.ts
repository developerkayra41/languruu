"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const GUARD_STATE_KEY = "unsavedGuard";

function hasSentinel(): boolean {
  return Boolean(
    (window.history.state as Record<string, unknown> | null)?.[GUARD_STATE_KEY],
  );
}

export function useUnsavedGuard(
  isDirty: boolean,
  askToLeave: () => Promise<boolean>,
) {
  const router = useRouter();
  const dirtyRef = useRef(isDirty);
  const askRef = useRef(askToLeave);
  const sentinelIdRef = useRef<string | null>(null);
  const sentinelKeysRef = useRef<string | null>(null);

  dirtyRef.current = isDirty;
  askRef.current = askToLeave;

  const keySignature = (state: unknown) =>
    Object.keys((state as Record<string, unknown>) ?? {})
      .sort()
      .join("|");

  const pushSentinel = () => {
    const id = Math.random().toString(36).slice(2);
    const state = { ...window.history.state, [GUARD_STATE_KEY]: id };
    window.history.pushState(state, "", window.location.href);
    sentinelIdRef.current = id;
    sentinelKeysRef.current = keySignature(state);
  };

  const isOwnSentinelOnTop = () => {
    const state = window.history.state as Record<string, unknown> | null;
    return (
      sentinelIdRef.current !== null &&
      state?.[GUARD_STATE_KEY] === sentinelIdRef.current &&
      keySignature(state) === sentinelKeysRef.current
    );
  };

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();

      void askRef.current().then((allowed) => {
        if (!allowed) return;
        dirtyRef.current = false;
        const destination = `${url.pathname}${url.search}`;
        if (isOwnSentinelOnTop()) router.replace(destination);
        else router.push(destination);
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!isDirty) return;
    if (!hasSentinel()) pushSentinel();

    let active = true;
    const onPopState = () => {
      if (!active || !dirtyRef.current) return;
      if (hasSentinel()) return;

      void askRef.current().then((allowed) => {
        if (allowed) {
          dirtyRef.current = false;
          window.history.back();
        } else {
          pushSentinel();
        }
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      active = false;
      window.removeEventListener("popstate", onPopState);
      if (isOwnSentinelOnTop()) {
        sentinelIdRef.current = null;
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);
}

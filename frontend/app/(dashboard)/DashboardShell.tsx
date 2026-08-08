"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Avatar from "../components/ui/Avatar";
import { logout, resendVerificationAction } from "./actions";
import { setLocale } from "../i18n/actions";
import { toast } from "sonner";
import Logo from "../components/ui/Logo";
import Reveal from "../components/ui/Reveal";
import ThemeToggle from "../components/ui/ThemeToggle";

// Masaüstü üst sekme çubuğu (mevcut davranış)
const TABS = [
  { href: "/study", key: "study" },
  { href: "/words", key: "words" },
  { href: "/add", key: "add" },
  { href: "/groups", key: "groups" },
  { href: "/top-performers", key: "topPerformers" },
  { href: "/marketplace", key: "marketplace" },
];

// Mobil alt navigasyon çubuğu — native uygulama hissi için 5 ana hedef.
// Kısa etiketler (nav.*Short) + ikon kullanılır. Top Performers avatar menüsünde.
const MOBILE_NAV = [
  { href: "/study", key: "studyShort", icon: "fa-graduation-cap" },
  { href: "/words", key: "wordsShort", icon: "fa-list" },
  { href: "/add", key: "addShort", icon: "fa-circle-plus" },
  { href: "/groups", key: "groupsShort", icon: "fa-layer-group" },
  { href: "/marketplace", key: "marketplaceShort", icon: "fa-store" },
];

// Tab çubuğunun (masaüstü) GÖSTERİLMEYECEĞİ route'lar
const NO_TAB_BAR_ROUTES = ["/profile", "/settings", "/users/", "/admin"];

interface DashboardShellProps {
  children: React.ReactNode;
  profile: {
    user_name: string;
    avatar_url?: string;
    email_verified?: boolean;
    is_admin: boolean;
  } | null;
}

export default function DashboardShell({
  children,
  profile,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tb = useTranslations("verifyBanner");
  const locale = useLocale();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const languageMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sayfanın herhangi bir yerine basınca açık menüleri kapat
  useEffect(() => {
    const handleOutside = (e: Event) => {
      const target = e.target as Node;
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  const showTabBar = !NO_TAB_BAR_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const [, startTransition] = useTransition();
  const changeLocale = (l: string) =>
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-30 bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <Link
              href="/study"
              className="flex items-center hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Logo className="w-7 h-7 mr-2" />
              Languruu
            </Link>
          </h1>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggle />
            <div
              ref={languageMenuRef}
              className="relative"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            >
              <button className="flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full px-3 sm:px-4 py-1 text-sm font-medium transition cursor-pointer whitespace-nowrap">
                <i className="fas fa-globe sm:mr-2"></i>
                <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                <i className="fas fa-chevron-down ml-1 sm:ml-2 text-xs"></i>
              </button>
              <div
                className={`absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 z-50 dropdown-menu ${isLanguageMenuOpen ? "active" : ""}`}
              >
                <button
                  onClick={() => changeLocale("tr")}
                  className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-flag mr-2"></i>Türkçe
                </button>
                <button
                  onClick={() => changeLocale("en")}
                  className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-flag-usa mr-2"></i>English
                </button>
              </div>
            </div>
            <div
              ref={profileMenuRef}
              className="relative"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.user_name ?? "?"}
                size={40}
                className="border-2 border-white cursor-pointer"
              />

              <div
                className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 dropdown-menu ${isProfileMenuOpen ? "active" : ""}`}
              >
                <Reveal>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-user mr-2 w-4"></i>{t("profile")}
                  </Link>
                  {/* Top Performers mobil alt bara sığmadığı için buradan erişilir */}
                  <Link
                    href="/top-performers"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 md:hidden"
                  >
                    <i className="fas fa-trophy mr-2 w-4"></i>
                    {t("topPerformers")}
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-cog mr-2 w-4"></i>{t("settings")}
                  </Link>
                  {profile?.is_admin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fas fa-gauge-high mr-2 w-4"></i>{t("admin")}
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <i className="fas fa-sign-out-alt mr-2 w-4"></i>
                      {t("logout")}
                    </button>
                  </form>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {profile && profile.email_verified === false && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm">
          <div className="container mx-auto px-4 py-2 max-w-6xl flex items-center justify-between gap-3">
            <span>
              <i className="fas fa-envelope mr-2"></i>
              {tb("text")}
            </span>
            <button
              onClick={() =>
                startTransition(async () => {
                  const r = await resendVerificationAction();
                  if (r.success) toast.success(tb("resent"));
                  else toast.error(r.error);
                })
              }
              className="underline hover:no-underline whitespace-nowrap"
            >
              {tb("resend")}
            </button>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 pt-6 pb-28 md:py-8 max-w-6xl">
        {showTabBar && (
          <div className="hidden md:flex border-b mb-6 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 font-medium whitespace-nowrap transition-all duration-300 hover:text-purple-500 ${
                    isActive
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-500"
                  }`}
                >
                  {t(tab.key)}
                </Link>
              );
            })}
          </div>
        )}

        {children}
      </div>

      {/* Mobil alt navigasyon çubuğu — native uygulama hissi */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-1px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {MOBILE_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "text-purple-600" : "text-gray-400"
                }`}
              >
                <i className={`fas ${item.icon} text-lg leading-none`}></i>
                <span className="leading-none">{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

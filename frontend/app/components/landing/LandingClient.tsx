"use client";

import Link from "next/link";
import { motion, MotionConfig, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Logo from "@/app/components/ui/Logo";
import { Locale } from "@/app/i18n/locales";

const features = [
  { icon: "fa-layer-group", key: "groups" },
  { icon: "fa-shuffle", key: "modes" },
  { icon: "fa-store", key: "marketplace" },
  { icon: "fa-fire", key: "progress" },
];

const steps = [
  { n: "1", key: "s1" },
  { n: "2", key: "s2" },
  { n: "3", key: "s3" },
];

const heroContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };

const dropIn: Variants = {
  hidden: { opacity: 0, y: -28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const gridContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const viewport = { once: true, margin: "-80px" };

export default function LandingClient({
  isLoggedIn,
  locale,
}: {
  isLoggedIn: boolean;
  locale: Locale;
}) {
  const t = useTranslations("landing");
  const home = locale === "en" ? "/en" : "/";
  const other = locale === "en" ? { href: "/", label: "TR" } : { href: "/en", label: "EN" };
  const primary = isLoggedIn
    ? { href: "/study", label: t("goToApp") }
    : { href: "/register", label: t("getStarted") };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-gray-800">
        {}
        <header className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href={home} className="flex items-center gap-2 text-purple-600 font-bold text-xl">
            <Logo className="w-7 h-7" /> Languruu
          </Link>
          <nav className="flex items-center gap-3">
            <a
              href={other.href}
              hrefLang={other.href === "/en" ? "en" : "tr"}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 px-2 py-2"
            >
              {other.label}
            </a>
            {!isLoggedIn && (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">{t("signIn")}</Link>
            )}
            <Link href={primary.href} className="text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition">
              {primary.label}
            </Link>
          </nav>
        </header>

        {}
        <motion.section
          className="max-w-3xl mx-auto px-5 pt-16 pb-20 text-center"
          variants={heroContainer} initial="hidden" animate="show"
        >
          <motion.span variants={dropIn} className="inline-block text-xs font-semibold tracking-wide uppercase text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-6">
            {t("badge")}
          </motion.span>
          <motion.h1 variants={dropIn} className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 text-balance">
            {t.rich("heroTitle", {
              hl: (chunks) => (
                <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{chunks}</span>
              ),
            })}
          </motion.h1>
          <motion.p variants={dropIn} className="text-lg text-gray-500 mt-5 max-w-xl mx-auto">
            {t("heroSubtitle")}
          </motion.p>
          <motion.div variants={dropIn} className="flex items-center justify-center gap-3 mt-8">
            <Link href={primary.href} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition transform hover:scale-[1.02] active:scale-95">
              {primary.label}
            </Link>
            {!isLoggedIn && (
              <Link href="/login" className="px-6 py-3 rounded-lg font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-95 transition">
                {t("signIn")}
              </Link>
            )}
          </motion.div>
        </motion.section>

        {}
        <section className="max-w-6xl mx-auto px-5 py-16">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}
            className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            {t("featuresTitle")}
          </motion.h2>
          <motion.div variants={gridContainer} initial="hidden" whileInView="show" viewport={viewport}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <motion.div key={f.key} variants={fadeUp}
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <i className={`fas ${f.icon} text-lg`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{t(`features.${f.key}Title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`features.${f.key}Text`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-5 py-16">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}
            className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            {t("howTitle")}
          </motion.h2>
          <motion.div variants={gridContainer} initial="hidden" whileInView="show" viewport={viewport}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white flex items-center justify-center text-lg font-bold mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{t(`steps.${s.key}Title`)}</h3>
                <p className="text-sm text-gray-500">{t(`steps.${s.key}Text`)}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-5 py-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}
            className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl px-8 py-14 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-balance">{t("ctaTitle")}</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">{t("ctaText")}</p>
            <Link href={primary.href} className="inline-block bg-white text-purple-700 px-7 py-3 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition">
              {primary.label}
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2 text-purple-600 font-semibold">
              <Logo className="w-5 h-5" /> Languruu
            </div>
            <nav className="flex items-center gap-5">
              <Link href="/privacy" className="hover:text-gray-800">{t("footerPrivacy")}</Link>
              <Link href="/terms" className="hover:text-gray-800">{t("footerTerms")}</Link>
              <Link href="/login" className="hover:text-gray-800">{t("footerLogin")}</Link>
            </nav>
            <span>© {new Date().getFullYear()} Languruu</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

import {
  getAdminStats,
  getAdminUsers,
  getAdminErrors,
  getAdminSecurityEvents,
  getAdminReports,
  getAdminDiscoverySources,
} from "@/app/lib/api-client";
import AdminUsersPanel from "./AdminUsersPanel";
import AdminReports from "./AdminReports";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  let stats, users, errors, events, reports, discovery;
  try {
    [stats, users, errors, events, reports, discovery] = await Promise.all([
      getAdminStats(),
      getAdminUsers({ page: 1 }),
      getAdminErrors(),
      getAdminSecurityEvents(),
      getAdminReports(),
      getAdminDiscoverySources(),
    ]);
  } catch {
    return (
      <div className="text-center py-20">
        <div className="text-4xl text-gray-300 mb-3">
          <i className="fas fa-lock"></i>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">
          {t("accessDenied")}
        </h1>
        <p className="text-gray-500 mt-1">{t("accessDeniedText")}</p>
      </div>
    );
  }

  const contentCards = [
    { label: t("totalGroups"), value: stats.total_groups, icon: "fa-layer-group" },
    { label: t("totalWords"), value: stats.total_words, icon: "fa-book" },
    { label: t("sharedGroups"), value: stats.shared_groups, icon: "fa-store" },
  ];
  const numLocale = locale === "tr" ? "tr-TR" : "en-US";
  const answered = discovery.filter((d) => d.source !== "unanswered");
  const answeredTotal = answered.reduce((sum, d) => sum + d.count, 0) || 1;
  const dt = (s: string) =>
    new Date(s).toLocaleString(numLocale, {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm">{t("subtitle")}</p>
      </div>

      <AdminUsersPanel stats={stats} initial={users} />
      <AdminReports initial={reports} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {contentCards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <i className={`fas ${c.icon}`}></i>
            </div>
            <div className="text-3xl font-bold text-gray-900 tabular-nums">
              {c.value.toLocaleString(numLocale)}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">
          {t("discoveryTitle")}
        </h2>
        {answered.length === 0 ? (
          <p className="text-sm text-gray-400">{t("discoveryEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {answered.map((d) => (
              <div key={d.source} className="text-sm">
                <div className="flex justify-between gap-2 mb-1">
                  <span className="text-gray-700">
                    {t(`discoverySources.${d.source}`)}
                  </span>
                  <span className="text-gray-400 tabular-nums">
                    {d.count.toLocaleString(numLocale)} ·{" "}
                    {Math.round((d.count / answeredTotal) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500"
                    style={{ width: `${(d.count / answeredTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">
            {t("recentErrors")}
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {errors.length === 0 && (
              <p className="text-sm text-gray-400">{t("noErrors")}</p>
            )}
            {errors.map((e) => (
              <div key={e.id} className="text-sm border-b border-gray-50 pb-2">
                <div className="flex justify-between gap-2">
                  <span className="text-red-600 font-medium truncate">
                    {e.message}
                  </span>
                  <span className="text-gray-400 whitespace-nowrap text-xs">
                    {dt(e.created_at)}
                  </span>
                </div>
                <div className="text-gray-400 text-xs">
                  {e.method} {e.path} · user:{e.user_id ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3">
            {t("recentSecurity")}
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="text-sm border-b border-gray-50 pb-2 flex justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-gray-700">
                    {ev.event_type}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {ev.email ?? `user:${ev.user_id ?? "-"}`} ·{" "}
                    {ev.ip_address ?? "-"}
                  </span>
                </div>
                <span className="text-gray-400 whitespace-nowrap text-xs">
                  {dt(ev.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

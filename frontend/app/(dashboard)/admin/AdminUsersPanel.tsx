"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { listUsersAction, banUserAction, unbanUserAction } from "./actions";
import { AdminStats, AdminUser, AdminUsersPage } from "@/app/types/admin";

const PAGE_SIZE = 10;
const tones: Record<string, string> = { purple: "bg-purple-50 text-purple-600", green: "bg-green-50 text-green-600" };

const filterCards = [
  { key: "all", labelKey: "totalUsers", icon: "fa-users", tone: "purple", get: (s: AdminStats) => s.total_users },
  { key: "online", labelKey: "onlineNow", icon: "fa-circle", tone: "green", live: true, get: (s: AdminStats) => s.online_now },
  { key: "today", labelKey: "registeredToday", icon: "fa-user-plus", tone: "purple", get: (s: AdminStats) => s.users_today },
  { key: "week", labelKey: "registeredWeek", icon: "fa-calendar-week", tone: "purple", get: (s: AdminStats) => s.users_week },
];

export default function AdminUsersPanel({ stats, initial }: { stats: AdminStats; initial: AdminUsersPage }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const locale = useLocale();
  const numLocale = locale === "tr" ? "tr-TR" : "en-US";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersPage>(initial);
  const [isPending, startTransition] = useTransition();

  const load = (o: { filter?: string; search?: string; page?: number }) => {
    const f = o.filter ?? filter, s = o.search ?? search, p = o.page ?? page;
    startTransition(async () => {
      const r = await listUsersAction({ filter: f, search: s, page: p });
      if (r.success) setData({ items: r.items, total: r.total });
      else toast.error(r.error);
    });
  };

  const selectFilter = (key: string) => { setFilter(key); setPage(1); load({ filter: key, page: 1 }); };
  const doSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load({ page: 1 }); };
  const goPage = (p: number) => { setPage(p); load({ page: p }); };

  const openProfile = (u: AdminUser) => router.push(`/users/${u.user_name}`);

  const toggleBan = (u: AdminUser) => {
    startTransition(async () => {
      const r = u.is_banned ? await unbanUserAction(u.id) : await banUserAction(u.id);
      if (r.success) {
        setData((d) => ({ ...d, items: d.items.map((x) => x.id === u.id ? { ...x, is_banned: !u.is_banned } : x) }));
        toast.success(u.is_banned ? t("banRemoved") : t("userBanned"));
      } else toast.error(r.error);
    });
  };

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const activeKey = filterCards.find((f) => f.key === filter)?.labelKey;

  return (
    <div className="space-y-5">
      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {filterCards.map((f) => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => selectFilter(f.key)}
              className={`text-left bg-white rounded-xl border p-4 transition-all ${active ? "border-purple-400 ring-2 ring-purple-100" : "border-gray-100 hover:border-gray-200 hover:-translate-y-0.5"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[f.tone]}`}><i className={`fas ${f.icon} text-sm`}></i></div>
                {f.live && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
              </div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{f.get(stats).toLocaleString(numLocale)}</div>
              <div className="text-xs text-gray-500">{t(f.labelKey)}</div>
            </button>
          );
        })}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {activeKey ? t(activeKey) : ""} <span className="text-sm text-gray-400 font-normal ml-1">({data.total})</span>
          </h2>
          <form onSubmit={doSearch} className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-56" />
            <button disabled={isPending} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap">{t("search")}</button>
          </form>
        </div>

        <div className={`hidden md:block overflow-x-auto transition-opacity ${isPending ? "opacity-50" : ""}`}>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400 bg-gray-50/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("colName")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colUsername")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colEmail")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("colAction")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} onClick={() => openProfile(u)} className="border-t border-gray-50 hover:bg-purple-50/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <Link href={`/users/${u.user_name}`} onClick={(e) => e.stopPropagation()} className="hover:text-purple-600 hover:underline">{u.full_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">@{u.user_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.is_banned
                      ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{t("banned")}</span>
                      : <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{t("active")}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); toggleBan(u); }} disabled={isPending}
                      className={`text-xs px-3 py-1 rounded-md disabled:opacity-50 transition ${u.is_banned ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                      {u.is_banned ? t("unban") : t("ban")}
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">{t("noUsers")}</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobil: kart listesi */}
        <div className={`md:hidden divide-y divide-gray-50 transition-opacity ${isPending ? "opacity-50" : ""}`}>
          {data.items.map((u) => (
            <div key={u.id} onClick={() => openProfile(u)} className="p-4 cursor-pointer active:bg-purple-50/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    <Link href={`/users/${u.user_name}`} onClick={(e) => e.stopPropagation()} className="hover:text-purple-600">{u.full_name}</Link>
                  </div>
                  <div className="text-sm text-gray-500 truncate">@{u.user_name}</div>
                  <div className="text-xs text-gray-400 truncate">{u.email}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {u.is_banned
                    ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{t("banned")}</span>
                    : <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{t("active")}</span>}
                  <button onClick={(e) => { e.stopPropagation(); toggleBan(u); }} disabled={isPending}
                    className={`text-xs px-3 py-1 rounded-md disabled:opacity-50 transition ${u.is_banned ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                    {u.is_banned ? t("unban") : t("ban")}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {data.items.length === 0 && (
            <div className="px-4 py-10 text-center text-gray-400">{t("noUsers")}</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <span className="text-gray-400 tabular-nums">{t("page", { page, total: totalPages })}</span>
            <div className="flex gap-1">
              <button onClick={() => goPage(page - 1)} disabled={page === 1 || isPending} className="px-3 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30">{t("prev")}</button>
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages || isPending} className="px-3 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30">{t("next")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import Avatar from "@/app/components/ui/Avatar";
import Reveal from "@/app/components/ui/Reveal";
import { getTopPerformers } from "@/app/lib/api-client";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
  if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400";
  if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600";
  return "bg-gradient-to-r from-purple-600 to-blue-500";
}

export default async function TopPerformersPage() {
  const performers = await getTopPerformers();
  const t = await getTranslations("topPerformers");

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("title")}</h2>

      {performers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t("empty")}</div>
      ) : (
        <div className="space-y-4">
          {performers.map((performer, i) => {
            const rank = i + 1;
            return (
              <Reveal key={performer.user_id}>
                <Link
                  href={`/users/${performer.user_name}`}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={performer.avatar_url}
                      name={performer.full_name}
                      size={56}
                    />
                    <div
                      className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${getRankBadgeStyle(rank)}`}
                    >
                      #{rank}
                    </div>
                  </div>

                  <div className="ml-5 flex-grow flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {performer.full_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-fire text-orange-500"></i>
                      <span className="font-bold text-purple-600">
                        {performer.streak}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {t("dayUnit")}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

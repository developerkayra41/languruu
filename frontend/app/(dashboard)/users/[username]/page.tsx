import { getFriendStatus, getProfile, getPublicProfile } from "@/app/lib/api-client";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import StatCard from "@/app/components/ui/StatCard";
import ProfileNotFound from "@/app/components/ui/ProfileNotFound";
import Image from "next/image";
import ReportButton from "@/app/components/report/ReportButton";
import LevelBadge from "@/app/components/ui/LevelBadge";
import FriendButton from "@/app/components/social/FriendButton";
import MessageButton from "@/app/components/social/MessageButton";
import type { FriendRelation } from "@/app/types/social";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  let myUsername: string | null = null;
  try {
    const myProfile = await getProfile();
    myUsername = myProfile.user_name;
  } catch {
    myUsername = null;
  }

  if (myUsername === username) {
    redirect("/profile");
  }

  let profile;
  try {
    profile = await getPublicProfile(username);
  } catch {
    return <ProfileNotFound />;
  }

  let relation: FriendRelation = { status: "none", request_id: null };
  if (myUsername) {
    try {
      relation = await getFriendStatus(username);
    } catch {
      relation = { status: "none", request_id: null };
    }
  }

  const initials = profile.user_name.slice(0, 2).toUpperCase();
  const t = await getTranslations("profile");
  const tf = await getTranslations("friends");

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500" />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex items-end justify-between gap-4">
            <div>
              {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.user_name}
                width={112}
                height={112}
                className="rounded-full object-cover border-4 border-white shadow-md"
              />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-semibold">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center shrink-0">
              <LevelBadge
                level={profile.level}
                xpIntoLevel={profile.xp_into_level}
                xpForNext={profile.xp_for_next}
                size={96}
                uid={`u-${profile.user_name}`}
                caption={t("levelShort")}
                title={t("levelTooltip", {
                  level: profile.level,
                  current: profile.xp_into_level,
                  next: profile.xp_for_next,
                })}
              />
              <span className="-mt-1 text-xs font-medium text-gray-500">
                {t("levelProgress", {
                  current: profile.xp_into_level,
                  next: profile.xp_for_next,
                })}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {profile.full_name}
              </h2>
              <span className="text-sm text-gray-500">@{profile.user_name}</span>
              <span className="text-sm text-gray-400 ml-2">
                · {tf("friendCount", { count: profile.friend_count })}
              </span>
            </div>
            {myUsername && (
              <div className="flex items-center gap-2">
                <FriendButton
                  userName={profile.user_name}
                  initialStatus={relation.status}
                  initialRequestId={relation.request_id}
                />
                <MessageButton
                  userName={profile.user_name}
                  isFriend={relation.status === "friends"}
                />
              </div>
            )}
          </div>
          <div className="flex justify-between items-start gap-4">
            <p
              className={`text-sm mt-2 max-w-xl whitespace-pre-wrap ${
                profile.description ? "text-gray-600" : "text-gray-400 italic"
              }`}
            >
              {profile.description || t("bioEmptyPublic")}
            </p>
            <ReportButton targetType="profile" targetRef={profile.user_name} />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("statsTitle")}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon="fa-book-reader"
            label={t("totalWords")}
            value={profile.total_words}
          />
          <StatCard
            icon="fa-flag-checkered"
            label={t("completedRounds")}
            value={profile.completed_rounds}
          />
          <StatCard
            icon="fa-fire"
            label={t("dailyStreak")}
            value={profile.daily_streak}
            suffix={t("dayUnit")}
          />
          <StatCard
            icon="fa-layer-group"
            label={t("wordPool")}
            value={profile.word_pool_count}
          />
          <StatCard
            icon="fa-gamepad"
            label={t("gameScore")}
            value={profile.game_score}
          />
        </div>
      </div>
    </div>
  );
}

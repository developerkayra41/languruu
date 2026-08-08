// app/(dashboard)/users/[username]/page.tsx
import { getProfile, getPublicProfile } from "@/app/lib/api-client";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import StatCard from "@/app/components/ui/StatCard";
import ProfileNotFound from "@/app/components/ui/ProfileNotFound";
import Image from "next/image";
import ReportButton from "@/app/components/report/ReportButton";

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

  // redirect() burada, HİÇBİR try/catch'in içinde değil
  if (myUsername === username) {
    redirect("/profile");
  }

  let profile;
  try {
    profile = await getPublicProfile(username);
  } catch {
    return <ProfileNotFound />;
  }

  const initials = profile.user_name.slice(0, 2).toUpperCase();
  const t = await getTranslations("profile");

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500" />
        <div className="px-6 pb-6">
          <div className="-mt-14">
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
          <h2 className="text-xl font-bold text-gray-800 mt-4">
            @{profile.user_name}
          </h2>
          <div className="flex justify-between">
            <p className="text-gray-500 text-sm mt-1">
              {t.rich("learned", {
                count: profile.total_words,
                b: (chunks) => (
                  <span className="font-semibold text-gray-700">{chunks}</span>
                ),
              })}
            </p>
            <ReportButton targetType="profile" targetRef={profile.user_name} />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("statsTitle")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      </div>
    </div>
  );
}

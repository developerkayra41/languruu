"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAvatar, requestAvatarUploadUrl, saveProfile } from "./actions";
import StatCard from "@/app/components/ui/StatCard";
import AvatarCropModal from "@/app/components/ui/AvatarCropModal";
import Avatar from "@/app/components/ui/Avatar";
import { useRouter } from "next/navigation";
import Reveal from "@/app/components/ui/Reveal";
import { useConfirm } from "@/app/components/ui/useConfirm";
import { toast } from "sonner";

interface ProfileClientProps {
  initialProfile: {
    user_name: string;
    full_name: string;
    avatar_url?: string;
    email: string;
    total_words: number;
    word_pool_count: number;
    daily_streak: number;
    completed_rounds: number;
  };
}

export default function ProfileClient({ initialProfile }: ProfileClientProps) {
  const t = useTranslations("profile");
  const { confirm, confirmDialog } = useConfirm();
  const [userName, setUserName] = useState(initialProfile.user_name);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [cropModalImage, setCropModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);

  const handleDeleteAvatar = async () => {
    if (!(await confirm({ message: t("removePhotoConfirm"), danger: true })))
      return;

    setIsDeletingAvatar(true);
    const result = await deleteAvatar();
    if (!result.success) {
      toast.error(result.error);
    } else {
      setAvatarUrl(undefined);
      router.refresh();
    }
    setIsDeletingAvatar(false);
  };

  const handleSaveName = async () => {
    if (!tempName.trim() || tempName.trim() === userName) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    const result = await saveProfile({ user_name: tempName.trim() });
    if (!result.success) {
      toast.error(result.error);
    } else {
      setUserName(tempName.trim());
      setIsEditingName(false);
    }
    setIsSavingName(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCropModalImage(objectUrl);

    e.target.value = "";
  };

  const handleCropCancel = () => {
    if (cropModalImage) URL.revokeObjectURL(cropModalImage);
    setCropModalImage(null);
  };

  const handleCropComplete = async (blob: Blob) => {
    if (cropModalImage) URL.revokeObjectURL(cropModalImage);
    setCropModalImage(null);

    setIsUploadingAvatar(true);
    try {
      const urlResult = await requestAvatarUploadUrl("jpg");
      if (!urlResult.success) throw new Error(urlResult.error);

      const uploadRes = await fetch(urlResult.data.signedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) throw new Error(t("uploadFailed"));

      const saveResult = await saveProfile({
        avatar_url: urlResult.data.publicUrl,
      });
      if (!saveResult.success) throw new Error(saveResult.error);

      setAvatarUrl(urlResult.data.publicUrl);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="w-full">
      {confirmDialog}
      <Reveal>

        {}
        <div className="relative bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500" />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-16">
              <div className="relative">
                <Avatar
                  src={avatarUrl}
                  name={userName}
                  size={128}
                  className="border-4 border-white shadow-md"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileSelected}
                  className="hidden"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  title={t("changePhoto")}
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-purple-600 hover:scale-105 transition disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <i className="fas fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fas fa-pen text-sm"></i>
                  )}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar || isDeletingAvatar}
                    title={t("removePhoto")}
                    className="absolute bottom-1 left-1 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-red-600 hover:scale-105 transition disabled:opacity-50"
                  >
                    {isDeletingAvatar ? (
                      <i className="fas fa-spinner fa-spin text-sm"></i>
                    ) : (
                      <i className="fas fa-trash text-sm"></i>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    autoFocus
                    className="text-xl font-bold text-gray-800 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(false);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800">
                    @{userName}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-gray-400 hover:text-purple-600"
                  >
                    <i className="fas fa-pen text-sm"></i>
                  </button>
                </>
              )}
            </div>

            <p className="text-gray-500 text-sm mt-1">
              {t.rich("learned", {
                count: initialProfile.total_words,
                b: (chunks) => (
                  <span className="font-semibold text-gray-700">{chunks}</span>
                ),
              })}
            </p>
          </div>
        </div>

        {}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("statsTitle")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon="fa-book-reader"
              label={t("totalWords")}
              value={initialProfile.total_words}
            />
            <StatCard
              icon="fa-flag-checkered"
              label={t("completedRounds")}
              value={initialProfile.completed_rounds}
            />
            <StatCard
              icon="fa-fire"
              label={t("dailyStreak")}
              value={initialProfile.daily_streak}
              suffix={t("dayUnit")}
            />
            <StatCard
              icon="fa-layer-group"
              label={t("wordPool")}
              value={initialProfile.word_pool_count}
            />
          </div>
        </div>
      </Reveal>

      {cropModalImage && (
        <AvatarCropModal
          imageSrc={cropModalImage}
          onCancel={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Avatar from "@/app/components/ui/Avatar";
import AvatarCropModal from "@/app/components/ui/AvatarCropModal";
import { completeProfileSetupAction } from "@/app/(dashboard)/actions";
import {
  deleteAvatar,
  requestAvatarUploadUrl,
  saveProfile,
} from "@/app/(dashboard)/profile/actions";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

interface ProfileSetupModalProps {
  initialAvatarUrl?: string;
  fallbackName: string;
}

export default function ProfileSetupModal({
  initialAvatarUrl,
  fallbackName,
}: ProfileSetupModalProps) {
  const t = useTranslations("profileSetup");
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [userName, setUserName] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropCancel = () => {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);
  };

  const handleCropComplete = async (blob: Blob) => {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);

    setIsUploading(true);
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

      setAvatarUrl(saveResult.data.avatar_url ?? urlResult.data.publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsDeleting(true);
    const result = await deleteAvatar();
    if (!result.success) toast.error(result.error);
    else setAvatarUrl(undefined);
    setIsDeleting(false);
  };

  const handleSave = async () => {
    const next = userName.trim();

    if (next.length < 3 || next.length > 16) {
      toast.error(t("errUserNameLen"));
      return;
    }
    if (!USERNAME_PATTERN.test(next)) {
      toast.error(t("errUserNameChars"));
      return;
    }

    setIsSaving(true);
    const result = await completeProfileSetupAction(next);
    if (!result.success) {
      toast.error(result.error);
      setIsSaving(false);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  if (!mounted || !open) return null;

  const isBusy = isUploading || isDeleting || isSaving;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500" />

          <div className="px-6 pb-6">
            <div className="flex justify-center -mt-14">
              <div className="relative">
                <Avatar
                  src={avatarUrl}
                  name={userName.trim() || fallbackName}
                  size={112}
                  className="border-4 border-white shadow-md"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  title={avatarUrl ? t("changePhoto") : t("addPhoto")}
                  aria-label={avatarUrl ? t("changePhoto") : t("addPhoto")}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-purple-600 hover:scale-105 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <i className="fas fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fas fa-pen text-sm"></i>
                  )}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={isBusy}
                    title={t("removePhoto")}
                    aria-label={t("removePhoto")}
                    className="absolute bottom-0 left-0 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-red-600 hover:scale-105 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (
                      <i className="fas fa-spinner fa-spin text-sm"></i>
                    ) : (
                      <i className="fas fa-trash text-sm"></i>
                    )}
                  </button>
                )}
              </div>
            </div>

            <h3 className="mt-4 text-center text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              {t("title")}
            </h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-5">
              {t("subtitle")}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("userName")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                @
              </span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value.replace(/\s/g, ""))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  if (!isBusy) void handleSave();
                }}
                maxLength={16}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                placeholder={t("userNamePlaceholder")}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{t("userNameHint")}</p>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="w-full mt-5 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {isSaving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </div>

      {cropImage && (
        <div className="relative z-[100]">
          <AvatarCropModal
            imageSrc={cropImage}
            onCancel={handleCropCancel}
            onCropComplete={handleCropComplete}
          />
        </div>
      )}
    </>,
    document.body,
  );
}

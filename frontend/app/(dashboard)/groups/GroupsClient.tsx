"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { WordColumnWithoutPool } from "@/app/types/word";
import { setActiveGroup, createGroup, toggleGroupShare } from "./actions";
import LanguageSelect from "@/app/components/ui/LanguageSelect";
import { toast } from "sonner";
import { LanguagePair } from "@/app/components/ui/Flags";
import Link from "next/link";

interface GroupsClientProps {
  groups: WordColumnWithoutPool[];
}

export default function GroupsClient({ groups }: GroupsClientProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const [shareModalGroup, setShareModalGroup] =
    useState<WordColumnWithoutPool | null>(null);
  const [pendingShareValue, setPendingShareValue] = useState(false);

  const [newGroupLang1, setNewGroupLang1] = useState<string | null>(null);
  const [newGroupLang2, setNewGroupLang2] = useState<string | null>(null);

  const handleStudy = (groupId: number) => {
    startTransition(() => {
      setActiveGroup(groupId); // içeride redirect("/study") var
    });
  };

  const openShareModal = (group: WordColumnWithoutPool) => {
    setShareModalGroup(group);
    setPendingShareValue(group.isShared);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error(t("errNameEmpty"));
      return;
    }
    if (!newGroupLang1 || !newGroupLang2) {
      toast.error(t("errPickLangs"));
      return;
    }
    if (newGroupLang1 === newGroupLang2) {
      toast.error(t("errSameLang"));
      return;
    }

    startTransition(async () => {
      const result = await createGroup(newGroupName, newGroupDescription, [
        newGroupLang1,
        newGroupLang2,
      ]);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setIsCreateModalOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupLang1(null);
      setNewGroupLang2(null);
      toast.success(t("created", { name: result.createdGroup.name }));
      router.refresh();
    });
  };

  const handleSaveShare = () => {
    if (!shareModalGroup) return;
    startTransition(async () => {
      const result = await toggleGroupShare(
        shareModalGroup.id,
        pendingShareValue,
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setShareModalGroup(null);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {group.languages && group.languages.length > 0 && (
                    <LanguagePair
                      languages={group.languages}
                      className="text-blue-100"
                    />
                  )}
                  {group.isShared && (
                    <i
                      className="fas fa-globe text-blue-100"
                      title={t("public")}
                    ></i>
                  )}
                </div>
              </div>
              <p className="text-sm text-blue-100 mt-1">
                {t("wordCount", { count: group.word_count })}
              </p>
            </div>
            <div className="p-4">
              {group.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {group.description}
                </p>
              )}
              {group.sourceShareId && group.sourceAuthorUsername && (
                <p className="text-xs text-gray-400 mb-3">
                  <i className="fas fa-user mr-1"></i>
                  {t.rich("addedFrom", {
                    username: group.sourceAuthorUsername,
                    link: (c) => (
                      <Link
                        href={`/users/${group.sourceAuthorUsername}`}
                        className="text-gray-500 hover:text-purple-600 hover:underline font-medium"
                      >
                        {c}
                      </Link>
                    ),
                  })}
                </p>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStudy(group.id)}
                  disabled={isPending}
                  className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  <i className="fas fa-play mr-1"></i> {t("study")}
                </button>
                <button
                  onClick={() => openShareModal(group)}
                  className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer"
                >
                  <i className="fas fa-share-alt mr-1"></i> {t("share")}
                </button>
              </div>
            </div>
          </div>
        ))}

        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center p-8 hover:bg-gray-100 transition cursor-pointer"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-3">
              <i className="fas fa-plus text-lg"></i>
            </div>
            <h3 className="font-medium text-gray-700">{t("newGroupTitle")}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("newGroupSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {t("createModalTitle")}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("groupName")}
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("descriptionOptional")}
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <LanguageSelect
                  label={t("sourceLang")}
                  value={newGroupLang1}
                  onChange={setNewGroupLang1}
                  excludeCode={newGroupLang2}
                />
                <LanguageSelect
                  label={t("targetLang")}
                  value={newGroupLang2}
                  onChange={setNewGroupLang2}
                  excludeCode={newGroupLang1}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isPending}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 font-medium cursor-pointer"
                >
                  {isPending ? t("creating") : t("create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareModalGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {t("shareModalTitle")}
              </h3>
              <button
                onClick={() => setShareModalGroup(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            {shareModalGroup.word_count === 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-md text-sm">
                {t("emptyWarning")}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("groupName")}
                </label>
                <input
                  type="text"
                  value={shareModalGroup.name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {t("shareSettings")}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={pendingShareValue}
                      onChange={() => setPendingShareValue(true)}
                      className="mr-2"
                    />
                    <span>{t("publicOption")}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!pendingShareValue}
                      onChange={() => setPendingShareValue(false)}
                      className="mr-2"
                    />
                    <span>{t("onlyMe")}</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShareModalGroup(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSaveShare}
                  disabled={
                    isPending ||
                    (pendingShareValue && shareModalGroup?.word_count === 0)
                  }
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 font-medium cursor-pointer"
                >
                  {isPending ? t("saving") : t("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

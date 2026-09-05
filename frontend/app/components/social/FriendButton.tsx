"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/app/components/ui/useConfirm";
import {
  cancelFriendRequestAction,
  removeFriendAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "./actions";
import type { RelationStatus } from "@/app/types/social";

interface FriendButtonProps {
  userName: string;
  initialStatus: RelationStatus;
  initialRequestId: number | null;
}

export default function FriendButton({
  userName,
  initialStatus,
  initialRequestId,
}: FriendButtonProps) {
  const t = useTranslations("friends");
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirm();
  const [status, setStatus] = useState<RelationStatus>(initialStatus);
  const [requestId, setRequestId] = useState<number | null>(initialRequestId);
  const [isPending, startTransition] = useTransition();

  if (status === "self") return null;

  const apply = (
    fn: () => Promise<
      | { success: true; data: { status: RelationStatus; request_id: number | null } }
      | { success: false; error: string }
    >,
    successMessage?: string,
  ) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setStatus(result.data.status);
      setRequestId(result.data.request_id);
      if (successMessage) toast.success(successMessage);
      router.refresh();
    });

  const handleAdd = () =>
    apply(() => sendFriendRequestAction(userName), t("requestSent"));

  const handleCancel = async () => {
    if (!(await confirm({ message: t("cancelConfirm"), danger: true }))) return;
    apply(() => cancelFriendRequestAction(userName));
  };

  const handleRemove = async () => {
    if (!(await confirm({ message: t("removeConfirm", { name: userName }), danger: true })))
      return;
    apply(() => removeFriendAction(userName));
  };

  const handleRespond = (action: "accept" | "reject") => {
    if (!requestId) return;
    apply(
      () => respondFriendRequestAction(requestId, action),
      action === "accept" ? t("nowFriends") : undefined,
    );
  };

  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 cursor-pointer";

  return (
    <>
      {status === "none" && (
        <button onClick={handleAdd} disabled={isPending} className={`${base} bg-purple-600 text-white hover:bg-purple-700`}>
          <i className="fas fa-user-plus"></i>
          {t("add")}
        </button>
      )}

      {status === "pending_outgoing" && (
        <button onClick={handleCancel} disabled={isPending} className={`${base} bg-gray-100 text-gray-600 hover:bg-gray-200`}>
          <i className="fas fa-clock"></i>
          {t("pendingOutgoing")}
        </button>
      )}

      {status === "pending_incoming" && (
        <div className="flex items-center gap-2">
          <button onClick={() => handleRespond("accept")} disabled={isPending} className={`${base} bg-purple-600 text-white hover:bg-purple-700`}>
            <i className="fas fa-user-check"></i>
            {t("accept")}
          </button>
          <button onClick={() => handleRespond("reject")} disabled={isPending} className={`${base} bg-gray-100 text-gray-600 hover:bg-gray-200`}>
            {t("reject")}
          </button>
        </div>
      )}

      {status === "friends" && (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className={`${base} group bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700`}
        >
          <span className="group-hover:hidden">
            <i className="fas fa-user-check"></i>
          </span>
          <span className="hidden group-hover:inline">
            <i className="fas fa-user-xmark"></i>
          </span>
          <span className="group-hover:hidden">{t("friends")}</span>
          <span className="hidden group-hover:inline">{t("remove")}</span>
        </button>
      )}

      {confirmDialog}
    </>
  );
}

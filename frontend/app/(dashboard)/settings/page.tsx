import { getProfile } from "@/app/lib/api-client";
import type { PresenceVisibility } from "@/app/types/social";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  let currentEmail = "";
  let hasPassword = true;
  let presenceVisibility: PresenceVisibility = "off";
  try {
    const profile = await getProfile();
    currentEmail = profile.email;
    hasPassword = profile.has_password;
    presenceVisibility = profile.presence_visibility ?? "off";
  } catch {
  }
  return (
    <SettingsClient
      currentEmail={currentEmail}
      hasPassword={hasPassword}
      presenceVisibility={presenceVisibility}
    />
  );
}

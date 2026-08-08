import { getProfile } from "@/app/lib/api-client";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  let currentEmail = "";
  let hasPassword = true;
  try {
    const profile = await getProfile();
    currentEmail = profile.email;
    hasPassword = profile.has_password;
  } catch {
    // profil çekilemezse boş göster
  }
  return (
    <SettingsClient currentEmail={currentEmail} hasPassword={hasPassword} />
  );
}

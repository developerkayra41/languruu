import { getProfile } from "@/app/lib/api-client";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;
  try {
    profile = await getProfile();
  } catch {
    // Profil çekilemezse (örn. token süresi dolmuş), navbar varsayılan haliyle gösterilir
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
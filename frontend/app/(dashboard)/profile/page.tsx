import { getProfile } from "@/app/lib/api-client";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const profile = await getProfile();
  return <ProfileClient initialProfile={profile} />;
}
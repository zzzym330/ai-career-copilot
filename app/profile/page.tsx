import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ProfileBuilder } from "@/components/profile/ProfileBuilder";

export const metadata: Metadata = {
  title: "我的职业画像 | 职觉 JobPulse",
  description: "建立标准化职业画像",
};

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileBuilder />
    </AppShell>
  );
}

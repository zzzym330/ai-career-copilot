import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { GapAnalysisDashboard } from "@/components/gap-analysis/GapAnalysisDashboard";

export const metadata: Metadata = {
  title: "岗位差距分析 | 职觉 JobPulse",
  description: "对比目标岗位与职业画像，识别优先提升方向",
};

export default function GapAnalysisPage() {
  return (
    <AppShell showJourneyNav>
      <GapAnalysisDashboard />
    </AppShell>
  );
}

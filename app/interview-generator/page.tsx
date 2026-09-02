import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { InterviewQuestionPack } from "@/components/interview/InterviewQuestionPack";

export const metadata: Metadata = {
  title: "个性化面试题 | 职觉 JobPulse",
  description: "基于目标岗位、职业画像和差距分析生成面试准备清单",
};

export default function InterviewGeneratorPage() {
  return (
    <AppShell showJourneyNav>
      <InterviewQuestionPack />
    </AppShell>
  );
}

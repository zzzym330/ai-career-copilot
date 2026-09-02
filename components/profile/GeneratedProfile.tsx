import { SkillTags } from "@/components/SkillTags";
import { ContentSection } from "@/components/AppShell";
import { ProfileRadar } from "@/components/profile/ProfileRadar";
import type { CareerProfile } from "@/types/profile";

const explorations = [
  "AI 产品与 AI Native 应用方向",
  "内容策略与品牌传播方向",
  "数据运营与商业分析方向",
  "科技行业咨询与解决方案方向",
];

const strengths = [
  "AI 公司和实验室相关实习经历",
  "内容运营、品牌传播和跨部门协作经验",
  "信息计量、数据科学和基础数据分析能力",
  "熟悉 SQL、Python、Excel 等数据分析工具",
  "熟悉主流 AI 工具与 Prompt Engineering",
  "具备用户研究与基础产品思维",
];

const growthAreas = [
  "产品需求文档 PRD 的系统化表达",
  "SQL 和数据分析能力",
  "产品指标理解",
  "技术方案理解",
  "面试项目表达能力",
];

type GeneratedProfileProps = {
  profile: CareerProfile;
  canContinueToGap: boolean;
  onContinueToGap: () => void;
  onEdit: () => void;
  onRestart: () => void;
};

export function GeneratedProfile({
  canContinueToGap,
  onContinueToGap,
  onEdit,
  onRestart,
}: GeneratedProfileProps) {
  return (
    <div className="space-y-5">
      <DashboardCard>
        <SectionLabel>JobPulse Career DNA</SectionLabel>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950">
          通用职业能力结构
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          Career DNA 展示稳定、可持续追踪的通用职业能力，是后续差距分析、职业路径与面试准备的能力基线。
        </p>
        <div className="mt-4">
          <ProfileRadar />
        </div>
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <InsightCard title="核心优势" items={strengths} />
        <InsightCard title="待强化能力" items={growthAreas} />
      </div>

      <DashboardCard>
        <h3 className="text-lg font-semibold text-neutral-950">可探索方向</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          基于当前教育、实践与技能背景，可以进一步探索这些发展方向。它们仅用于拓展视野，不是精准职位推荐。
        </p>
        <div className="mt-4">
          <SkillTags items={explorations} />
        </div>
      </DashboardCard>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
        >
          重新上传
        </button>
        <button
          type="button"
          onClick={onEdit}
          className={`h-11 rounded-full px-5 text-sm font-semibold transition ${
            canContinueToGap
              ? "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950"
              : "bg-neutral-950 text-white hover:bg-neutral-800"
          }`}
        >
          返回编辑
        </button>
        {canContinueToGap ? (
          <button
            type="button"
            onClick={onContinueToGap}
            className="h-11 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            继续查看岗位差距分析
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DashboardCard({ children }: { children: React.ReactNode }) {
  return <ContentSection>{children}</ContentSection>;
}

function InsightCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <ContentSection>
      <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-base leading-7 text-neutral-600"
          >
            <span className="font-semibold text-neutral-950">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ContentSection>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </p>
  );
}

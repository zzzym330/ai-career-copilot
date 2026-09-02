import { AgentWorkflow } from "@/components/AgentWorkflow";
import { AnalysisHistory } from "@/components/AnalysisHistory";
import { SkillTags } from "@/components/SkillTags";
import type {
  AnalysisHistoryEntry,
  AnalysisPhase,
  AnalysisResult,
} from "@/types/analysis";

type AnalysisPanelProps = {
  activeStep: number;
  activeHistoryId: string | null;
  error: string | null;
  isDemoResult: boolean;
  phase: AnalysisPhase;
  result: AnalysisResult;
  history: AnalysisHistoryEntry[];
  onClearHistory: () => void;
  onDeleteHistory: (id: string) => void;
  onOpenGapAnalysis: () => void;
  onSelectHistory: (entry: AnalysisHistoryEntry) => void;
};

export function AnalysisPanel({
  activeStep,
  activeHistoryId,
  error,
  isDemoResult,
  phase,
  result,
  history,
  onClearHistory,
  onDeleteHistory,
  onOpenGapAnalysis,
  onSelectHistory,
}: AnalysisPanelProps) {
  return (
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-[#fbfaf7] shadow-[0_24px_80px_rgba(23,23,23,0.06)] lg:h-full lg:min-h-0">
      <header className="shrink-0 border-b border-neutral-200 bg-[#fbfaf7] px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
          Insight Panel
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
          AI岗位洞察
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-6">
          {error ? <StatusNotice message={error} /> : null}
          {isDemoResult && phase === "done" ? (
            <StatusNotice message="当前为演示分析结果" subtle />
          ) : null}
          {phase === "idle" ? <EmptyState /> : null}
          {phase === "analyzing" ? (
            <AgentWorkflow activeStep={activeStep} />
          ) : null}
          {phase === "done" ? (
            <AnalysisResultView
              result={result}
              onOpenGapAnalysis={onOpenGapAnalysis}
            />
          ) : null}
          <AnalysisHistory
            activeHistoryId={activeHistoryId}
            history={history}
            onClear={onClearHistory}
            onDelete={onDeleteHistory}
            onSelect={onSelectHistory}
          />
        </div>
      </div>
    </section>
  );
}

function StatusNotice({
  message,
  subtle = false,
}: {
  message: string;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-base leading-7 ${
        subtle
          ? "border-neutral-200 bg-white text-neutral-500"
          : "border-stone-300 bg-stone-100 text-stone-700"
      }`}
    >
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white/70 px-6 text-center">
      <div className="max-w-sm">
        <p className="text-base font-medium text-neutral-950">
          等待岗位信号输入
        </p>
        <p className="mt-3 text-xs leading-6 text-neutral-400">
          支持产品、运营、数据、技术、AI、咨询等岗位 JD
        </p>
      </div>
    </div>
  );
}

function AnalysisResultView({
  result,
  onOpenGapAnalysis,
}: {
  result: AnalysisResult;
  onOpenGapAnalysis: () => void;
}) {
  return (
    <div className="space-y-6 pb-1">
      <PanelCard>
        <SectionLabel>岗位名称</SectionLabel>
        <p className="mt-2 text-2xl font-semibold leading-tight text-neutral-950">
          {result.jobTitle}
        </p>
      </PanelCard>

      <PanelCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <SectionLabel>岗位门槛分析</SectionLabel>
            <p className="mt-2 text-base leading-7 text-neutral-500">
              综合技能、业务、协作、语言与行业经验要求
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-neutral-300 bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
            {result.jobThresholdLevel}
          </div>
        </div>
        <div className="mt-5 border-t border-neutral-100 pt-4">
          <p className="text-xs font-medium text-neutral-400">判断依据</p>
          <p className="mt-2 text-base leading-7 text-neutral-700">
            {result.thresholdReason}
          </p>
        </div>
      </PanelCard>

      <PanelCard>
        <SectionLabel>核心职责</SectionLabel>
        <div className="mt-3 grid gap-3">
          {result.responsibilities.map((item) => (
            <ListCard key={item}>{item}</ListCard>
          ))}
        </div>
      </PanelCard>

      <PanelCard>
        <SectionLabel>核心技能</SectionLabel>
        <div className="mt-3">
          <SkillTags items={result.coreSkills} />
        </div>
      </PanelCard>

      <PanelCard>
        <SectionLabel>岗位画像</SectionLabel>
        <p className="mt-3 text-base leading-7 text-neutral-700">
          {result.jobPersona}
        </p>
      </PanelCard>

      <button
        type="button"
        onClick={onOpenGapAnalysis}
        className="w-full rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(23,23,23,0.16)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_30px_rgba(23,23,23,0.22)] active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
      >
        开始岗位匹配分析
      </button>
    </div>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-base font-medium leading-7 text-neutral-800">
      {children}
    </div>
  );
}

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </p>
  );
}

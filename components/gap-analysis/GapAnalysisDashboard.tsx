"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ContentSection, PageHeader } from "@/components/AppShell";
import { mockGapAnalysisResult } from "@/lib/mock-gap-analysis";
import {
  CONFIRMED_PROFILE_KEY,
  CURRENT_JD_ANALYSIS_KEY,
  GAP_ANALYSIS_RESULT_KEY,
} from "@/lib/storage-keys";
import type { CareerDnaGapItem, GapAnalysisResult } from "@/types/gap-analysis";

export function GapAnalysisDashboard() {
  const savedAnalysis = useSyncExternalStore(
    subscribeToStorage,
    getSavedAnalysis,
    () => null,
  );
  const savedProfile = useSyncExternalStore(
    subscribeToStorage,
    getSavedProfile,
    () => null,
  );
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!savedAnalysis || !savedProfile) {
      return;
    }

    let cancelled = false;

    async function generateGapAnalysis() {
      try {
        const response = await fetch("/api/gap-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdAnalysis: JSON.parse(savedAnalysis as string),
            profile: JSON.parse(savedProfile as string),
          }),
        });
        const payload = (await response.json()) as
          | GapAnalysisResult
          | { error?: string };

        if (!response.ok || !isGapAnalysisResult(payload)) {
          throw new Error("Gap Analysis API returned an invalid result.");
        }

        if (!cancelled) {
          setResult(payload);
          setIsFallback(false);
          window.localStorage.setItem(
            GAP_ANALYSIS_RESULT_KEY,
            JSON.stringify(payload),
          );
        }
      } catch {
        if (!cancelled) {
          window.localStorage.removeItem(GAP_ANALYSIS_RESULT_KEY);
          setResult(mockGapAnalysisResult);
          setIsFallback(true);
        }
      }
    }

    void generateGapAnalysis();
    return () => {
      cancelled = true;
    };
  }, [savedAnalysis, savedProfile]);

  if (!parseStorage(savedAnalysis)) {
    return (
      <GapEmptyState
        message="还没有可分析的岗位，请先完成一次 JD 解译。"
        actionLabel="去解译 JD"
        href="/"
      />
    );
  }

  if (!parseStorage(savedProfile)) {
    return (
      <GapEmptyState
        message="还没有职业画像，请先上传简历并生成职业画像。"
        actionLabel="去生成职业画像"
        href="/profile"
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Gap Analysis Engine"
        title="岗位差距分析"
        description="基于当前 JD 解译结果与已确认职业画像，分析你与目标岗位之间的能力、技能、经历和行业认知差距。"
      />
      <div className="page-container readable-content pb-8">
        {!result ? (
          <StatusNotice>正在生成岗位差距分析…</StatusNotice>
        ) : (
          <>
            {isFallback ? (
              <StatusNotice>AI 生成失败，当前展示示例结果。</StatusNotice>
            ) : null}

            <ContentSection>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                当前分析岗位
              </p>
              <p className="mt-2 text-xl font-semibold text-neutral-950">
                {result.targetJob}
              </p>
            </ContentSection>

            <ContentSection className="mt-5">
              <SectionHeading
                eyebrow="Career DNA Gap"
                title="通用职业能力对比"
                description="使用 JobPulse Career DNA 固定六维模型，对比岗位要求与当前能力基础。"
              />
              <div className="mt-6 space-y-5">
                {result.careerDNAGap.map((item) => (
                  <DnaComparison key={item.dimension} item={item} />
                ))}
              </div>
            </ContentSection>

            <section className="mt-6">
              <SectionHeading
                eyebrow="Skill Gap"
                title="专业技能差距"
                description="区分已经具备、部分具备和需要补充的岗位技能。"
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <ListPanel title="已具备技能" items={result.skillGap.matched} />
                <ListPanel title="部分具备技能" items={result.skillGap.partial} />
                <ListPanel title="待补充技能" items={result.skillGap.missing} />
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading
                eyebrow="Experience Gap"
                title="经历证据差距"
                description="识别已有匹配经历、面试应重点强调的经历和仍需补充的经历。"
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <ListPanel
                  title="已有匹配经历"
                  items={result.experienceGap.matchedExperience}
                />
                <ListPanel
                  title="可重点强调经历"
                  items={result.experienceGap.highlightExperience}
                />
                <ListPanel
                  title="经历缺口"
                  items={result.experienceGap.missingExperience}
                />
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <DashboardPanel title="行业认知要求" eyebrow="Industry Gap">
                <ItemList items={result.industryGap} />
              </DashboardPanel>
              <DashboardPanel title="优先行动建议" eyebrow="Next Actions">
                <ol className="space-y-4">
                  {result.priorityActions.map((action, index) => (
                    <li
                      key={action}
                      className="flex gap-4 text-sm leading-7 text-neutral-700"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </DashboardPanel>
            </section>

            <section className="mt-6 border-t border-neutral-200 pt-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                    Next Steps
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                    将差距转化为下一步行动
                  </h2>
                </div>
              </div>
              <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <Link href="/" className={secondaryActionClass}>
                  返回岗位洞察
                </Link>
                <Link
                  href="/interview-generator"
                  className={primaryActionClass}
                >
                  生成个性化面试题
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function DnaComparison({ item }: { item: CareerDnaGapItem }) {
  const badge =
    item.status === "advantage"
      ? `优势 ${item.diff}`
      : item.status === "gap"
        ? `差距 ${item.diff}`
        : `持平 ${item.diff}`;

  return (
    <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_76px] sm:items-center">
      <p className="text-sm font-semibold text-neutral-900">{item.dimension}</p>
      <div className="space-y-2">
        <ScoreBar label="岗位要求" value={item.jobRequiredScore} dark />
        <ScoreBar label="当前能力" value={item.userScore} />
      </div>
      <div
        title={item.reason}
        className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
          item.status === "advantage"
            ? "border-neutral-300 bg-neutral-950 text-white"
            : "border-stone-300 bg-stone-100 text-stone-700"
        }`}
      >
        {badge}
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: number;
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)_28px] items-center gap-3">
      <span className="text-xs text-neutral-400">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${dark ? "bg-neutral-950" : "bg-neutral-400"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-neutral-600">{value}</span>
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <div className="mt-4">
        <ItemList items={items} />
      </div>
    </div>
  );
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

function StatusNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
      {children}
    </div>
  );
}

function GapEmptyState({
  message,
  actionLabel,
  href,
}: {
  message: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="page-container readable-content flex min-h-[calc(100vh-156px)] items-center justify-center pb-8">
      <section className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-6 text-center shadow-[0_16px_48px_rgba(23,23,23,0.04)] sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
          Gap Analysis Engine
        </p>
        <h1 className="mt-3 text-xl font-semibold text-neutral-950">
          岗位差距分析尚未就绪
        </h1>
        <p className="mt-4 text-sm leading-7 text-neutral-600">{message}</p>
        <Link
          href={href}
          className="mt-5 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          {actionLabel}
        </Link>
      </section>
    </div>
  );
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSavedAnalysis() {
  return window.localStorage.getItem(CURRENT_JD_ANALYSIS_KEY);
}

function getSavedProfile() {
  return window.localStorage.getItem(CONFIRMED_PROFILE_KEY);
}

function parseStorage(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isGapAnalysisResult(
  value: GapAnalysisResult | { error?: string },
): value is GapAnalysisResult {
  return "careerDNAGap" in value && Array.isArray(value.careerDNAGap);
}

const secondaryActionClass =
  "inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950";

const primaryActionClass =
  "inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800";

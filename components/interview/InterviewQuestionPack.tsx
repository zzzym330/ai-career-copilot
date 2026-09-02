"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ContentSection, PageHeader } from "@/components/AppShell";
import { mockGapAnalysisResult } from "@/lib/mock-gap-analysis";
import {
  mockInterviewPackResult,
  toInterviewQuestionGroups,
} from "@/lib/mock-interview-questions";
import {
  CONFIRMED_PROFILE_KEY,
  CURRENT_JD_ANALYSIS_KEY,
  GAP_ANALYSIS_RESULT_KEY,
  INTERVIEW_PACK_KEY,
} from "@/lib/storage-keys";
import type { GapAnalysisResult } from "@/types/gap-analysis";
import type {
  InterviewPackResult,
  InterviewQuestion,
  InterviewQuestionGroup,
} from "@/types/interview";
import type { CareerProfile } from "@/types/profile";

export function InterviewQuestionPack() {
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
  const savedGapAnalysis = useSyncExternalStore(
    subscribeToStorage,
    getSavedGapAnalysis,
    () => null,
  );
  const analysis = parseStorage<Record<string, unknown>>(savedAnalysis);
  const profile = parseStorage<CareerProfile>(savedProfile);
  const [pack, setPack] = useState<InterviewPackResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [prepared, setPrepared] = useState<Set<string>>(() => new Set());
  const questionGroups = useMemo(
    () => (pack ? toInterviewQuestionGroups(pack) : []),
    [pack],
  );
  const totalQuestions = questionGroups.reduce(
    (total, group) => total + group.questions.length,
    0,
  );

  useEffect(() => {
    if (!savedAnalysis || !savedProfile) {
      return;
    }

    let cancelled = false;

    async function generateInterviewPack() {
      try {
        const requestAnalysis = parseStorage<Record<string, unknown>>(
          savedAnalysis,
        );
        const requestProfile = parseStorage<CareerProfile>(savedProfile);
        const cachedGapAnalysis =
          parseStorage<GapAnalysisResult>(savedGapAnalysis);
        const requestGapAnalysis =
          cachedGapAnalysis?.targetJob === requestAnalysis?.jobTitle
            ? cachedGapAnalysis
            : mockGapAnalysisResult;

        if (!requestAnalysis || !requestProfile) {
          throw new Error("Missing interview generation context.");
        }

        const response = await fetch("/api/interview-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdAnalysis: requestAnalysis,
            profile: requestProfile,
            gapAnalysis: requestGapAnalysis,
          }),
        });
        const payload = (await response.json()) as
          | InterviewPackResult
          | { error?: string };

        if (!response.ok || !isInterviewPackResult(payload)) {
          throw new Error("Interview Generator API returned an invalid result.");
        }

        if (!cancelled) {
          setPack(payload);
          setIsFallback(false);
          window.localStorage.setItem(INTERVIEW_PACK_KEY, JSON.stringify(payload));
        }
      } catch {
        if (!cancelled) {
          window.localStorage.removeItem(INTERVIEW_PACK_KEY);
          setPack(mockInterviewPackResult);
          setIsFallback(true);
        }
      }
    }

    void generateInterviewPack();
    return () => {
      cancelled = true;
    };
  }, [savedAnalysis, savedGapAnalysis, savedProfile]);

  if (!analysis) {
    return (
      <InterviewEmptyState
        message="还没有可生成面试题的岗位信息，请先完成 JD 解译。"
        actionLabel="去解译 JD"
        href="/"
      />
    );
  }

  if (!profile) {
    return (
      <InterviewEmptyState
        message="还没有职业画像，请先上传简历并生成职业画像。"
        actionLabel="去生成职业画像"
        href="/profile"
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Interview Question Pack"
        title="个性化面试题"
        description="基于当前 JD 解译结果、职业画像和差距分析，为你生成更贴近目标岗位的面试准备清单。"
      />
      <div className="page-container readable-content pb-8">
        {!pack ? (
          <StatusNotice>正在生成个性化面试题…</StatusNotice>
        ) : (
          <>
            {isFallback ? (
              <StatusNotice>AI 生成失败，当前展示示例结果。</StatusNotice>
            ) : null}
            <div className="mb-5 flex justify-end">
              <Progress prepared={prepared.size} total={totalQuestions} />
            </div>

            <Summary targetJob={pack.targetJob} />

            <div className="mt-5 space-y-5">
              {questionGroups.map((group) => (
                <QuestionSection
                  key={group.title}
                  group={group}
                  expanded={expanded}
                  prepared={prepared}
                  onToggleExpanded={(id) =>
                    setExpanded((current) => toggle(current, id))
                  }
                  onTogglePrepared={(id) =>
                    setPrepared((current) => toggle(current, id))
                  }
                />
              ))}
            </div>

            <PrioritySuggestions items={pack.priorityPreparation} />

            <section className="mt-6 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center">
              <Link href="/gap-analysis" className={secondaryActionClass}>
                返回岗位差距分析
              </Link>
              <div className="grid gap-3 sm:grid-cols-2">
                {["生成回答思路", "模拟面试"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    className="h-11 rounded-xl border border-neutral-200 bg-neutral-100 px-5 text-sm font-medium text-neutral-400"
                  >
                    {label} · Coming Soon
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function Progress({ prepared, total }: { prepared: number; total: number }) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-600">准备进度</span>
        <span className="font-semibold text-neutral-950">
          已准备 {prepared} / {total}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-950 transition-all"
          style={{ width: total ? `${(prepared / total) * 100}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function Summary({ targetJob }: { targetJob: string }) {
  return (
    <ContentSection>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
        Generation Context
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <SummaryItem label="目标岗位" value={targetJob} />
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-xs text-neutral-400">生成依据</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["JD 解译结果", "职业画像", "Gap Analysis"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 border-t border-neutral-200 pt-4 text-sm leading-7 text-neutral-600">
        这些问题不是通用题库，而是根据目标岗位要求、你的经历优势和当前差距生成的个性化面试题。
      </p>
    </ContentSection>
  );
}

function QuestionSection({
  group,
  expanded,
  prepared,
  onToggleExpanded,
  onTogglePrepared,
}: {
  group: InterviewQuestionGroup;
  expanded: Set<string>;
  prepared: Set<string>;
  onToggleExpanded: (id: string) => void;
  onTogglePrepared: (id: string) => void;
}) {
  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
        {group.eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">
        {group.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">
        {group.description}
      </p>
      <div className="mt-5 grid gap-4">
        {group.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index + 1}
            question={question}
            expanded={expanded.has(question.id)}
            prepared={prepared.has(question.id)}
            onToggleExpanded={() => onToggleExpanded(question.id)}
            onTogglePrepared={() => onTogglePrepared(question.id)}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({
  index,
  question,
  expanded,
  prepared,
  onToggleExpanded,
  onTogglePrepared,
}: {
  index: number;
  question: InterviewQuestion;
  expanded: boolean;
  prepared: boolean;
  onToggleExpanded: () => void;
  onTogglePrepared: () => void;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 transition ${
        prepared ? "border-neutral-400" : "border-neutral-200"
      }`}
    >
      <div className="flex gap-4">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            prepared
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {prepared ? "✓" : index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-7 text-neutral-900">
            {question.question}
          </p>
          {expanded ? (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <p className="text-xs font-medium text-neutral-400">
                {question.guidanceLabel}
              </p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                {question.guidance}
              </p>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950"
            >
              {expanded ? "收起提示" : `展开${question.guidanceLabel}`}
            </button>
            <button
              type="button"
              onClick={onTogglePrepared}
              aria-pressed={prepared}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                prepared
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950"
              }`}
            >
              {prepared ? "已准备" : "标记为已准备"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PrioritySuggestions({ items }: { items: string[] }) {
  return (
    <ContentSection className="mt-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
        Priority
      </p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">
        优先准备建议
      </h2>
      <ol className="mt-5 grid gap-4 lg:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm leading-7 text-neutral-700"
          >
            <span className="mb-4 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </ContentSection>
  );
}

function StatusNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
      {children}
    </div>
  );
}

function InterviewEmptyState({
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
          Interview Question Pack
        </p>
        <h1 className="mt-3 text-xl font-semibold text-neutral-950">
          个性化面试题尚未就绪
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-950">{value}</p>
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

function getSavedGapAnalysis() {
  return window.localStorage.getItem(GAP_ANALYSIS_RESULT_KEY);
}

function parseStorage<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isInterviewPackResult(
  value: InterviewPackResult | { error?: string },
): value is InterviewPackResult {
  return "questions" in value && typeof value.questions === "object";
}

function toggle(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const secondaryActionClass =
  "inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950";

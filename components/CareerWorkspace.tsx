"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { JDInputPanel } from "@/components/JDInputPanel";
import { ProfileRequiredModal } from "@/components/ProfileRequiredModal";
import {
  ANALYSIS_HISTORY_KEY,
  CURRENT_JD_ANALYSIS_KEY,
  PROFILE_CONFIRMED_KEY,
  RETURN_TO_GAP_KEY,
} from "@/lib/storage-keys";
import type {
  AnalysisPhase,
  AnalysisHistoryEntry,
  AnalysisResult,
  AnalyzeJdApiResult,
  AnalyzeJdErrorResponse,
  AnalyzeJdSuccessResponse,
  PersistedAnalysisResult,
} from "@/types/analysis";

const mockResult: AnalysisResult = {
  jobTitle: "TikTok 内容理解策略实习生",
  jobThresholdLevel: "中高",
  thresholdReason:
    "该岗位需要候选人具备内容策略、SQL 数据分析、英文沟通和跨团队协作能力，同时要求理解内容理解模型与国际化业务场景，因此整体进入门槛为中高。",
  responsibilities: [
    "参与内容标签体系建设与维护",
    "分析内容理解问题并推动模型迭代",
    "协同算法、产品和运营团队推进策略落地",
    "输出结构化分析报告支持业务决策",
  ],
  coreSkills: [
    "SQL",
    "数据分析",
    "内容理解",
    "模型训练",
    "英文沟通",
    "跨团队协作",
  ],
  jobPersona:
    "该岗位更偏向具备快速学习能力、沟通协调能力和内容产品意识的人才。岗位本身不是纯技术开发方向，而是侧重内容理解、策略推进、跨团队协作和业务落地。",
};

export function CareerWorkspace() {
  const router = useRouter();
  const savedAnalysisValue = useSyncExternalStore(
    subscribeToCurrentAnalysis,
    getSavedAnalysisValue,
    () => null,
  );
  const savedAnalysis = parseSavedAnalysis(savedAnalysisValue);
  const historyValue = useSyncExternalStore(
    subscribeToAnalysisHistory,
    getHistoryValue,
    () => null,
  );
  const history = parseAnalysisHistory(historyValue);
  const [jd, setJd] = useState<string | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(mockResult);
  const [error, setError] = useState<string | null>(null);
  const [isDemoResult, setIsDemoResult] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [canRestoreSavedResult, setCanRestoreSavedResult] = useState(true);

  const isAnalyzing = phase === "analyzing";
  const shouldRestoreSavedResult =
    canRestoreSavedResult && phase === "idle" && savedAnalysis !== null;
  const displayedJd = jd ?? savedAnalysis?.originalJd ?? "";
  const displayedPhase: AnalysisPhase = shouldRestoreSavedResult ? "done" : phase;
  const displayedResult = shouldRestoreSavedResult ? savedAnalysis : result;

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    const stepTimers = [0, 400, 800, 1200, 1600].map((delay, index) =>
      window.setTimeout(() => setActiveStep(index), delay),
    );

    return () => {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isAnalyzing]);

  async function handleAnalyze() {
    if (isAnalyzing) {
      return;
    }

    if (!displayedJd.trim()) {
      setError("请先输入岗位 JD，再开始解译。");
      return;
    }

    setPhase("analyzing");
    setActiveHistoryId(null);
    setCanRestoreSavedResult(false);
    setActiveStep(-1);
    setError(null);
    setIsDemoResult(false);

    try {
      const [analysis] = await Promise.all([
        requestAnalysis(displayedJd),
        waitForWorkflow(),
      ]);

      setResult(analysis);
      saveCurrentAnalysis(analysis, displayedJd);
      saveAnalysisHistory(analysis, displayedJd);
    } catch (requestError) {
      setResult(mockResult);
      saveCurrentAnalysis(mockResult, displayedJd);
      saveAnalysisHistory(mockResult, displayedJd);
      setIsDemoResult(true);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "真实 AI 分析暂时不可用，已展示演示结果。",
      );
    } finally {
      setActiveStep(4);
      setPhase("done");
    }
  }

  function handleSelectExample(exampleJd: string) {
    setJd(exampleJd);
    setCanRestoreSavedResult(false);
    setPhase("idle");
    setActiveStep(-1);
    setError(null);
    setIsDemoResult(false);
    setActiveHistoryId(null);
  }

  function handleSelectHistory(entry: AnalysisHistoryEntry) {
    setJd(entry.originalJd);
    setResult(entry.analysis);
    setPhase("done");
    setActiveStep(4);
    setError(null);
    setIsDemoResult(false);
    setCanRestoreSavedResult(false);
    setActiveHistoryId(entry.id);
    saveCurrentAnalysis(entry.analysis, entry.originalJd);
  }

  function handleDeleteHistory(id: string) {
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
    writeAnalysisHistory(history.filter((entry) => entry.id !== id));
  }

  function handleClearHistory() {
    setActiveHistoryId(null);
    writeAnalysisHistory([]);
  }

  function handleJdChange(value: string) {
    setJd(value);
    setCanRestoreSavedResult(false);
    setActiveHistoryId(null);
  }

  function handleOpenGapAnalysis() {
    saveCurrentAnalysis(displayedResult, displayedJd);

    if (window.localStorage.getItem(PROFILE_CONFIRMED_KEY) === "true") {
      router.push("/gap-analysis");
      return;
    }

    setShowProfilePrompt(true);
  }

  function handleCreateProfile() {
    saveCurrentAnalysis(displayedResult, displayedJd);
    window.localStorage.setItem(RETURN_TO_GAP_KEY, "true");
    router.push("/profile");
  }

  return (
    <div className="page-container readable-content grid gap-6 pb-8 pt-2 lg:h-[calc(100vh-156px)] lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)] lg:pb-7 lg:pt-2">
      <JDInputPanel
        jd={displayedJd}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleAnalyze}
        onChange={handleJdChange}
        onSelectExample={handleSelectExample}
      />
      <AnalysisPanel
        activeStep={activeStep}
        activeHistoryId={activeHistoryId}
        error={error}
        isDemoResult={isDemoResult}
        phase={displayedPhase}
        result={displayedResult}
        history={history}
        onClearHistory={handleClearHistory}
        onDeleteHistory={handleDeleteHistory}
        onOpenGapAnalysis={handleOpenGapAnalysis}
        onSelectHistory={handleSelectHistory}
      />
      {showProfilePrompt ? (
        <ProfileRequiredModal
          onClose={() => setShowProfilePrompt(false)}
          onCreateProfile={handleCreateProfile}
        />
      ) : null}
    </div>
  );
}

function saveAnalysisHistory(result: AnalysisResult, originalJd: string) {
  const currentHistory = parseAnalysisHistory(
    window.localStorage.getItem(ANALYSIS_HISTORY_KEY),
  );
  const entry: AnalysisHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    analyzedAt: new Date().toISOString(),
    originalJd,
    analysis: result,
  };

  writeAnalysisHistory([entry, ...currentHistory].slice(0, 10));
}

function writeAnalysisHistory(history: AnalysisHistoryEntry[]) {
  window.localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("jobpulse-analysis-history"));
}

function saveCurrentAnalysis(result: AnalysisResult, originalJd: string) {
  const persistedResult: PersistedAnalysisResult = {
    ...result,
    originalJd,
    analyzedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    CURRENT_JD_ANALYSIS_KEY,
    JSON.stringify(persistedResult),
  );
  window.dispatchEvent(new Event("jobpulse-current-analysis"));
}

function subscribeToCurrentAnalysis(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("jobpulse-current-analysis", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("jobpulse-current-analysis", onStoreChange);
  };
}

function subscribeToAnalysisHistory(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("jobpulse-analysis-history", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("jobpulse-analysis-history", onStoreChange);
  };
}

function getSavedAnalysisValue() {
  return window.localStorage.getItem(CURRENT_JD_ANALYSIS_KEY);
}

function getHistoryValue() {
  return window.localStorage.getItem(ANALYSIS_HISTORY_KEY);
}

function parseSavedAnalysis(value: string | null): PersistedAnalysisResult | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PersistedAnalysisResult;
  } catch {
    return null;
  }
}

function parseAnalysisHistory(value: string | null): AnalysisHistoryEntry[] {
  if (!value) {
    return [];
  }

  try {
    const history = JSON.parse(value) as unknown;
    return Array.isArray(history) ? (history as AnalysisHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

async function requestAnalysis(jd: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze-jd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jdText: jd }),
  });

  let payload: AnalyzeJdSuccessResponse | AnalyzeJdErrorResponse;

  try {
    payload = (await response.json()) as
      | AnalyzeJdSuccessResponse
      | AnalyzeJdErrorResponse;
  } catch {
    throw new Error("真实 AI 分析暂时不可用，已展示演示结果。");
  }

  if (!response.ok || !("jobTitle" in payload)) {
    throw new Error(
      "error" in payload
        ? payload.error
        : "真实 AI 分析暂时不可用，已展示演示结果。",
    );
  }

  return mapApiAnalysis(payload);
}

function mapApiAnalysis(analysis: AnalyzeJdApiResult): AnalysisResult {
  return {
    jobTitle: analysis.jobTitle,
    jobThresholdLevel: analysis.threshold.level,
    thresholdReason: analysis.threshold.reason,
    responsibilities: analysis.responsibilities,
    coreSkills: analysis.skills,
    jobPersona: analysis.jobProfile,
  };
}

function waitForWorkflow() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 2100);
  });
}

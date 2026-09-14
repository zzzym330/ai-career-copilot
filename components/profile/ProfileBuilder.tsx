"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { GeneratedProfile } from "@/components/profile/GeneratedProfile";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileSteps } from "@/components/profile/ProfileSteps";
import { ResumeUploader } from "@/components/profile/ResumeUploader";
import {
  CONFIRMED_PROFILE_KEY,
  CURRENT_JD_ANALYSIS_KEY,
  PROFILE_CONFIRMED_KEY,
  RETURN_TO_GAP_KEY,
} from "@/lib/storage-keys";
import type {
  CareerProfile,
  ParsedResumeResult,
  ProfileStage,
} from "@/types/profile";

type ResumeInputMode = "file" | "text";

type ProfileHistoryRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceType: ResumeInputMode;
  fileName?: string;
  profileDraft: CareerProfile;
  generatedProfile?: CareerProfile;
  title: string;
};

const PROFILE_HISTORY_KEY = "jobpulse_profile_history";
const MAX_PROFILE_HISTORY = 10;

const emptyProfile: CareerProfile = {
  targetDirections: [],
  education: [],
  internships: [],
  projects: [],
  skills: [],
  languages: [],
};

export function ProfileBuilder() {
  const router = useRouter();
  const savedProfileValue = useSyncExternalStore(
    subscribeToProfile,
    getSavedProfileValue,
    () => null,
  );
  const savedProfile = parseSavedProfile(savedProfileValue);
  const canContinueToGap = useSyncExternalStore(
    subscribeToProfile,
    getCanContinueToGap,
    () => false,
  );
  const [stageOverride, setStageOverride] = useState<ProfileStage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<ResumeInputMode>("file");
  const [resumeText, setResumeText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CareerProfile | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [profileHistory, setProfileHistory] = useState<ProfileHistoryRecord[]>(
    [],
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);

  const stage = stageOverride ?? (savedProfile ? "complete" : "upload");
  const profile = profileDraft ?? savedProfile ?? emptyProfile;
  const currentStep = stage === "upload" ? 1 : stage === "review" ? 2 : 3;
  const canEditProfile = profileDraft !== null || savedProfile !== null;
  const canViewProfile = stage === "complete" || savedProfile !== null;
  const currentHistoryFileName = profileHistory.find(
    (record) => record.id === currentHistoryId,
  )?.fileName;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfileHistory(readProfileHistory());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentHistoryId || !profileDraft) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateProfileHistory(currentHistoryId, {
        profileDraft,
        title: createHistoryTitle(profileDraft, currentHistoryFileName),
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [currentHistoryFileName, currentHistoryId, profileDraft]);

  function goToStage(nextStage: ProfileStage) {
    setStageOverride(nextStage);
    window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      workspaceScrollRef.current?.scrollTo(0, 0);
    });
  }

  function handleStepChange(step: number) {
    if (step === 1) {
      goToStage("upload");
      return;
    }

    if (step === 2 && canEditProfile) {
      goToStage("review");
      return;
    }

    if (step === 3 && canViewProfile) {
      goToStage("complete");
    }
  }

  function handleFileChange(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      setUploadError("仅支持 PDF 或 DOCX 文件。");
      setFile(null);
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setUploadError("文件大小不能超过 10MB。");
      setFile(null);
      return;
    }

    setUploadError(null);
    setFile(nextFile);
  }

  async function handleRecognize() {
    if (isRecognizing) {
      return;
    }

    if (inputMode === "file" && !file) {
      setUploadError("请先上传 PDF 或 DOCX 简历文件。");
      return;
    }

    if (inputMode === "text" && !resumeText.trim()) {
      setUploadError("请先输入简历内容。");
      return;
    }

    setIsRecognizing(true);
    setUploadError(null);
    setParseNotice(null);

    try {
      const parsedProfile =
        inputMode === "file" && file
          ? await requestResumeProfile({ resumeFile: file })
          : await requestResumeProfile({ resumeText });
      const nextProfile = toCareerProfile(parsedProfile);
      const fileName = inputMode === "file" ? file?.name : undefined;
      const historyRecord = createProfileHistoryRecord({
        fileName,
        profileDraft: nextProfile,
        sourceType: inputMode,
      });

      saveProfileHistoryRecord(historyRecord);
      setCurrentHistoryId(historyRecord.id);
      setProfileDraft(nextProfile);
      if (
        inputMode === "file" &&
        file?.name.toLowerCase().endsWith(".pdf") &&
        isLikelyIncompleteProfile(parsedProfile)
      ) {
        setParseNotice(
          "PDF 内容识别可能不完整，建议上传 DOCX 或切换为“粘贴简历文本”。",
        );
      }
      goToStage("review");
    } catch (error) {
      handleRecognizeError(error);
    } finally {
      setIsRecognizing(false);
    }
  }

  function handleRecognizeError(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[profile] resume recognition failed", error);
    }

    if (error instanceof ResumeProfileRequestError) {
      if (error.status >= 500) {
        setUploadError("简历解析失败，请稍后重试或切换为 DOCX / 粘贴文本。");
        return;
      }

      setUploadError(error.message);
      return;
    }

    setUploadError("简历解析失败，请稍后重试或切换为 DOCX / 粘贴文本。");
  }

  function saveProfileHistoryRecord(record: ProfileHistoryRecord) {
    setProfileHistory((currentHistory) => {
      const nextHistory = [
        record,
        ...currentHistory.filter((item) => item.id !== record.id),
      ].slice(0, MAX_PROFILE_HISTORY);
      writeProfileHistory(nextHistory);
      return nextHistory;
    });
  }

  function updateProfileHistory(
    id: string,
    patch: Partial<Omit<ProfileHistoryRecord, "id" | "createdAt">>,
  ) {
    setProfileHistory((currentHistory) => {
      const nextHistory = currentHistory.map((record) =>
        record.id === id
          ? { ...record, ...patch, updatedAt: new Date().toISOString() }
          : record,
      );
      writeProfileHistory(nextHistory);
      return nextHistory;
    });
  }

  function handleHistoryRestore(record: ProfileHistoryRecord) {
    setProfileDraft(record.generatedProfile ?? record.profileDraft);
    setCurrentHistoryId(record.id);
    setUploadError(null);
    setParseNotice(null);
    goToStage(record.generatedProfile ? "complete" : "review");
  }

  function handleHistoryDelete(id: string) {
    const nextHistory = profileHistory.filter((record) => record.id !== id);
    setProfileHistory(nextHistory);
    writeProfileHistory(nextHistory);

    if (id === currentHistoryId) {
      setCurrentHistoryId(null);
    }
  }

  function resetFlow() {
    goToStage("upload");
    setFile(null);
    setInputMode("file");
    setResumeText("");
    setIsRecognizing(false);
    setIsGeneratingProfile(false);
    setProfileDraft(null);
    setCurrentHistoryId(null);
    setUploadError(null);
    setParseNotice(null);
    window.localStorage.removeItem(PROFILE_CONFIRMED_KEY);
    window.localStorage.removeItem(CONFIRMED_PROFILE_KEY);
    window.dispatchEvent(new Event("jobpulse-profile"));
  }

  function handleResetRequest() {
    const shouldReset = window.confirm(
      "重新上传将开始新的简历解析，当前编辑内容将被重置，是否继续？",
    );

    if (shouldReset) {
      resetFlow();
    }
  }

  async function handleGenerateProfile() {
    if (isGeneratingProfile) {
      return;
    }

    setIsGeneratingProfile(true);
    setUploadError(null);

    try {
      await waitForProfileGeneration();
      const generatedProfile = profileDraft ?? profile;

      window.localStorage.setItem(PROFILE_CONFIRMED_KEY, "true");
      window.localStorage.setItem(
        CONFIRMED_PROFILE_KEY,
        JSON.stringify(generatedProfile),
      );
      window.dispatchEvent(new Event("jobpulse-profile"));
      setProfileDraft(generatedProfile);

      if (currentHistoryId) {
        updateProfileHistory(currentHistoryId, {
          generatedProfile,
          profileDraft: generatedProfile,
          title: createHistoryTitle(generatedProfile, currentHistoryFileName),
        });
      }

      goToStage("complete");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[profile] profile generation failed", error);
      }
      setUploadError("职业画像生成失败，请稍后重试。");
    } finally {
      setIsGeneratingProfile(false);
    }
  }

  function handleContinueToGap() {
    window.localStorage.removeItem(RETURN_TO_GAP_KEY);
    router.push("/gap-analysis");
  }

  return (
    <div className="page-container flex min-h-0 flex-col pb-4 pt-0 lg:h-[calc(100vh-118px)] lg:overflow-hidden">
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
        <aside className="flex min-h-0 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white/70 p-4 shadow-[0_16px_48px_rgba(23,23,23,0.04)] lg:h-full lg:overflow-hidden">
          <div className="mb-5 shrink-0">
            <p className="text-[12px] font-medium leading-4 text-neutral-500">
              Resume Profile Builder
            </p>
            <h1 className="mt-2 text-[26px] font-semibold leading-8 text-neutral-950">
              我的职业画像
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-neutral-500">
              将零散的教育、实习和技能经历整理为可复用的标准化职业画像。
            </p>
          </div>
          <ProfileSteps
            canEditProfile={canEditProfile}
            canViewProfile={canViewProfile}
            currentStep={currentStep}
            onStepChange={handleStepChange}
          />
          <ProfileHistoryList
            activeId={currentHistoryId}
            records={profileHistory}
            onDelete={handleHistoryDelete}
            onRestore={handleHistoryRestore}
          />
        </aside>

        <div className="min-h-0 lg:overflow-hidden">
          <div
            ref={workspaceScrollRef}
            className="h-full min-h-0 lg:overflow-y-auto lg:pr-1"
          >
            {uploadError ? (
              <div className="mb-3 rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700">
                {uploadError}
              </div>
            ) : null}
            {parseNotice ? (
              <div className="mb-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
                {parseNotice}
              </div>
            ) : null}

            {stage === "upload" ? (
              <ResumeUploader
                file={file}
                inputMode={inputMode}
                isRecognizing={isRecognizing}
                onFileChange={handleFileChange}
                onInputModeChange={setInputMode}
                onRecognize={handleRecognize}
                onResumeTextChange={setResumeText}
                resumeText={resumeText}
              />
            ) : null}

            {stage === "review" ? (
              <ProfileEditor
                isGenerating={isGeneratingProfile}
                profile={profile}
                onChange={setProfileDraft}
                onGenerate={handleGenerateProfile}
                onReset={handleResetRequest}
              />
            ) : null}

            {stage === "complete" ? (
              <GeneratedProfile
                profile={profile}
                canContinueToGap={canContinueToGap}
                isRegenerating={isGeneratingProfile}
                onContinueToGap={handleContinueToGap}
                onEdit={() => goToStage("review")}
                onRegenerate={handleGenerateProfile}
                onRestart={handleResetRequest}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

async function requestResumeProfile(
  input: { resumeText: string } | { resumeFile: File },
): Promise<ParsedResumeResult> {
  const isFileInput = "resumeFile" in input;

  if (isFileInput) {
    const body = new FormData();
    body.append("resumeFile", input.resumeFile);
    return fetchResumeProfile(body);
  }

  return fetchResumeProfile(JSON.stringify(input), {
    "Content-Type": "application/json",
  });
}

async function fetchResumeProfile(
  body: BodyInit,
  headers?: HeadersInit,
): Promise<ParsedResumeResult> {
  const response = await fetch("/api/parse-resume", {
    method: "POST",
    ...(headers ? { headers } : {}),
    body,
  });
  const payload = (await response.json()) as
    | ParsedResumeResult
    | { error: string };

  if (!response.ok || !("careerDNA" in payload)) {
    throw new ResumeProfileRequestError(
      "error" in payload ? payload.error : "AI 简历解析失败。",
      response.status,
    );
  }

  return payload;
}

class ResumeProfileRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function toCareerProfile(parsed: ParsedResumeResult): CareerProfile {
  return {
    targetDirections: [],
    education: parsed.education.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
    internships: parsed.internships.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
    projects: parsed.projects.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    })),
    skills: parsed.skills,
    languages: parsed.languages,
  };
}

function subscribeToProfile(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("jobpulse-profile", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("jobpulse-profile", onStoreChange);
  };
}

function getSavedProfileValue() {
  const isConfirmed =
    window.localStorage.getItem(PROFILE_CONFIRMED_KEY) === "true";

  return isConfirmed
    ? window.localStorage.getItem(CONFIRMED_PROFILE_KEY)
    : null;
}

function getCanContinueToGap() {
  return (
    window.localStorage.getItem(RETURN_TO_GAP_KEY) === "true" &&
    window.localStorage.getItem(CURRENT_JD_ANALYSIS_KEY) !== null
  );
}

function parseSavedProfile(value: string | null): CareerProfile | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CareerProfile;
  } catch {
    return null;
  }
}

function ProfileHistoryList({
  activeId,
  records,
  onDelete,
  onRestore,
}: {
  activeId: string | null;
  records: ProfileHistoryRecord[];
  onDelete: (id: string) => void;
  onRestore: (record: ProfileHistoryRecord) => void;
}) {
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-neutral-200 pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-5 text-neutral-950">
          历史画像
        </h2>
      </div>
      <p className="mt-1 shrink-0 text-[12px] leading-5 text-neutral-400">
        历史记录仅保存在当前浏览器中，清除浏览器数据后可能丢失。
      </p>

      {records.length > 0 ? (
        <div className="mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {records.map((record) => {
            const isActive = record.id === activeId;

            return (
              <div
                key={record.id}
                className={`rounded-xl border px-3 py-2 transition ${
                  isActive
                    ? "border-neutral-400 bg-white"
                    : "border-neutral-200 bg-white/60 hover:border-neutral-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onRestore(record)}
                    className="block min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <span className="block truncate text-[14px] font-medium leading-5 text-neutral-800">
                      {record.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="删除历史记录"
                    title="删除"
                    onClick={() => onDelete(record.id)}
                    className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[12px] font-normal leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[12px] leading-4 text-neutral-400">
                    {formatHistoryTime(record.updatedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[12px] leading-5 text-neutral-400">
          暂无历史画像
        </p>
      )}
    </div>
  );
}

function createProfileHistoryRecord({
  fileName,
  profileDraft,
  sourceType,
}: {
  fileName?: string;
  profileDraft: CareerProfile;
  sourceType: ResumeInputMode;
}): ProfileHistoryRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    sourceType,
    fileName,
    profileDraft,
    title: createHistoryTitle(profileDraft, fileName),
  };
}

function createHistoryTitle(profile: CareerProfile, fileName?: string) {
  const firstDirection = profile.targetDirections[0];
  const directionTitle = firstDirection
    ? (firstDirection.role ?? `${firstDirection.category}方向`)
    : "";

  if (directionTitle) {
    return directionTitle;
  }

  if (fileName) {
    return fileName;
  }

  return `职业画像 ${formatHistoryTime(new Date().toISOString())}`;
}

function readProfileHistory(): ProfileHistoryRecord[] {
  try {
    const value = window.localStorage.getItem(PROFILE_HISTORY_KEY);
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isProfileHistoryRecord).slice(0, MAX_PROFILE_HISTORY)
      : [];
  } catch {
    return [];
  }
}

function writeProfileHistory(records: ProfileHistoryRecord[]) {
  window.localStorage.setItem(
    PROFILE_HISTORY_KEY,
    JSON.stringify(records.slice(0, MAX_PROFILE_HISTORY)),
  );
}

function isProfileHistoryRecord(value: unknown): value is ProfileHistoryRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "createdAt" in value &&
    "updatedAt" in value &&
    "sourceType" in value &&
    "profileDraft" in value &&
    "title" in value
  );
}

function isLikelyIncompleteProfile(parsed: ParsedResumeResult) {
  const profileFields = [
    parsed.education,
    parsed.internships,
    parsed.projects,
    parsed.skills,
    parsed.languages,
  ];
  const emptySections = profileFields.filter((items) => items.length === 0);
  const informationGaps = JSON.stringify(parsed).match(/信息不足/g)?.length ?? 0;

  return emptySections.length >= 3 || informationGaps >= 4;
}

function waitForProfileGeneration() {
  return new Promise((resolve) => window.setTimeout(resolve, 500));
}

function formatHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}

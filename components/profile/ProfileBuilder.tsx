"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/AppShell";
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

const mockProfile: CareerProfile = {
  targetDirections: [
    { id: "direction-1", category: "产品" },
    { id: "direction-2", category: "运营", role: "内容运营" },
    { id: "direction-3", category: "AI", role: "AI相关岗位" },
  ],
  education: [
    {
      id: "education-1",
      school: "Northwest University",
      degree: "Master of Library and Information Science",
      focus: "Research Focus: Informetrics, Data Science",
    },
    {
      id: "education-2",
      school: "Taiyuan University of Technology",
      degree: "B.A. in English",
      focus: "English-Japanese bilingual direction",
    },
  ],
  internships: [
    {
      id: "internship-1",
      company: "ModelBest AI & OpenBMB Lab",
      role: "Brand & PR Operations Intern",
      description:
        "Produced AI-related content and supported brand communication.",
    },
    {
      id: "internship-2",
      company: "Baichuan AI",
      role: "Government Relations Intern",
      description:
        "Supported government reception events and meeting coordination.",
    },
    {
      id: "internship-3",
      company: "University Library",
      role: "Rotational Intern",
      description:
        "Worked across multiple library service and information management roles.",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "JobPulse",
      role: "AI Career Intelligence Platform",
      description:
        "Designed a JD analysis, profile builder and gap analysis workflow.",
    },
    {
      id: "project-2",
      name: "Academic Output Analysis",
      role: "Research Project",
      description:
        "Analyzed research output patterns using bibliometric methods.",
    },
  ],
  skills: [
    "SQL",
    "Python",
    "Excel",
    "User Research",
    "Prompt Engineering",
    "PRD Writing",
    "AI Tools",
    "Data Analysis",
  ],
  languages: ["Chinese", "English", "Japanese"],
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
  const [resumeText, setResumeText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [profileDraft, setProfileDraft] = useState<CareerProfile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  const stage = stageOverride ?? (savedProfile ? "complete" : "upload");
  const profile = profileDraft ?? savedProfile ?? mockProfile;
  const currentStep = stage === "upload" ? 1 : stage === "review" ? 2 : 3;

  function goToStage(nextStage: ProfileStage) {
    setStageOverride(nextStage);
    window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
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

    if (!resumeText.trim()) {
      setUploadError(
        "请先粘贴简历文本，当前版本暂不支持直接读取 PDF / DOCX 内容。",
      );
      return;
    }

    setIsRecognizing(true);
    setUploadError(null);
    setParseNotice(null);

    try {
      const parsedProfile = await requestResumeProfile(resumeText);
      setProfileDraft(toCareerProfile(parsedProfile));
    } catch {
      setProfileDraft(mockProfile);
      setParseNotice("AI 解析失败，已为你展示示例职业画像。");
    } finally {
      setIsRecognizing(false);
      goToStage("review");
    }
  }

  function resetFlow() {
    goToStage("upload");
    setFile(null);
    setResumeText("");
    setIsRecognizing(false);
    setProfileDraft(null);
    setUploadError(null);
    setParseNotice(null);
  }

  function handleGenerateProfile() {
    window.localStorage.setItem(PROFILE_CONFIRMED_KEY, "true");
    window.localStorage.setItem(CONFIRMED_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("jobpulse-profile"));
    setProfileDraft(profile);
    goToStage("complete");
  }

  function handleContinueToGap() {
    window.localStorage.removeItem(RETURN_TO_GAP_KEY);
    router.push("/gap-analysis");
  }

  return (
    <>
      <PageHeader
        eyebrow="Resume Profile Builder"
        title="我的职业画像"
        description="将零散的教育、实习和技能经历整理为可复用的标准化职业画像。"
      />
      <div className="page-container readable-content pb-8">
        <ProfileSteps currentStep={currentStep} />

        <div className="mt-4">
          {uploadError ? (
            <div className="mb-5 rounded-xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700">
              {uploadError}
            </div>
          ) : null}
          {parseNotice ? (
            <div className="mb-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
              {parseNotice}
            </div>
          ) : null}

          {stage === "upload" ? (
            <ResumeUploader
              file={file}
              isRecognizing={isRecognizing}
              onFileChange={handleFileChange}
              onRecognize={handleRecognize}
              onResumeTextChange={setResumeText}
              resumeText={resumeText}
            />
          ) : null}

          {stage === "review" ? (
            <ProfileEditor
              profile={profile}
              onChange={setProfileDraft}
              onGenerate={handleGenerateProfile}
              onReset={resetFlow}
            />
          ) : null}

          {stage === "complete" ? (
            <GeneratedProfile
              profile={profile}
              canContinueToGap={canContinueToGap}
              onContinueToGap={handleContinueToGap}
              onEdit={() => goToStage("review")}
              onRestart={resetFlow}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

async function requestResumeProfile(
  resumeText: string,
): Promise<ParsedResumeResult> {
  const response = await fetch("/api/parse-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText }),
  });
  const payload = (await response.json()) as
    | ParsedResumeResult
    | { error: string };

  if (!response.ok || !("careerDNA" in payload)) {
    throw new Error("error" in payload ? payload.error : "AI 简历解析失败。");
  }

  return payload;
}

function toCareerProfile(parsed: ParsedResumeResult): CareerProfile {
  return {
    targetDirections: mockProfile.targetDirections,
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

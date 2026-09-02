export type JobThresholdLevel = "低" | "中" | "中高" | "高";

export type AnalyzeJdApiResult = {
  jobTitle: string;
  threshold: {
    level: JobThresholdLevel;
    reason: string;
  };
  responsibilities: string[];
  skills: string[];
  jobProfile: string;
};

export type AnalysisResult = {
  jobTitle: string;
  jobThresholdLevel: JobThresholdLevel;
  thresholdReason: string;
  responsibilities: string[];
  coreSkills: string[];
  jobPersona: string;
};

export type PersistedAnalysisResult = AnalysisResult & {
  originalJd?: string;
  analyzedAt?: string;
};

export type AnalysisHistoryEntry = {
  id: string;
  analyzedAt: string;
  originalJd: string;
  analysis: AnalysisResult;
};

export type AnalyzeJdSuccessResponse = AnalyzeJdApiResult;

export type AnalyzeJdErrorResponse = {
  error: string;
};

export type AnalysisPhase = "idle" | "analyzing" | "done";

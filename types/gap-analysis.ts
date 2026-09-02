export type CareerDnaGapItem = {
  dimension: string;
  jobRequiredScore: number;
  userScore: number;
  status: "advantage" | "gap" | "balanced";
  diff: number;
  reason: string;
};

export type GapAnalysisResult = {
  targetJob: string;
  summary: string;
  careerDNAGap: CareerDnaGapItem[];
  skillGap: {
    matched: string[];
    partial: string[];
    missing: string[];
  };
  experienceGap: {
    matchedExperience: string[];
    highlightExperience: string[];
    missingExperience: string[];
  };
  industryGap: string[];
  priorityActions: string[];
};

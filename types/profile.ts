export type EducationExperience = {
  id: string;
  school: string;
  degree: string;
  focus: string;
};

export type InternshipExperience = {
  id: string;
  company: string;
  role: string;
  description: string;
};

export type ProjectExperience = {
  id: string;
  name: string;
  role: string;
  description: string;
};

export type CareerDirection = {
  id: string;
  category: string;
  role?: string;
};

export type CareerProfile = {
  targetDirections: CareerDirection[];
  education: EducationExperience[];
  internships: InternshipExperience[];
  projects: ProjectExperience[];
  skills: string[];
  languages: string[];
};

export type ProfileStage = "upload" | "review" | "complete";

export type CareerDnaScores = {
  learningAgility: number;
  strategicExecution: number;
  communication: number;
  selfDrivenGrowth: number;
  industryExposure: number;
  valueCommunication: number;
};

export type ParsedResumeResult = {
  education: Omit<EducationExperience, "id">[];
  internships: Omit<InternshipExperience, "id">[];
  projects: Omit<ProjectExperience, "id">[];
  skills: string[];
  languages: string[];
  careerDNA: CareerDnaScores;
  strengths: string[];
  transferableSkills: string[];
  growthAreas: string[];
  summary: string;
};

export type InterviewQuestion = {
  id: string;
  question: string;
  guidanceLabel: string;
  guidance: string;
};

export type InterviewQuestionGroup = {
  eyebrow: string;
  title: string;
  description: string;
  questions: InterviewQuestion[];
};

export type GeneratedInterviewQuestion = {
  question: string;
  hint: string;
  focus: string;
};

export type InterviewPackResult = {
  targetJob: string;
  questions: {
    whyYou: GeneratedInterviewQuestion[];
    experienceDeepDive: GeneratedInterviewQuestion[];
    gapFollowUp: GeneratedInterviewQuestion[];
    starBehavioral: GeneratedInterviewQuestion[];
    stressQuestions: GeneratedInterviewQuestion[];
    englishQuestions: GeneratedInterviewQuestion[];
  };
  priorityPreparation: string[];
};

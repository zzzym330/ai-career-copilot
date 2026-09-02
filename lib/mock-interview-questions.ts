import type {
  GeneratedInterviewQuestion,
  InterviewPackResult,
  InterviewQuestionGroup,
} from "@/types/interview";

export const mockInterviewPackResult: InterviewPackResult = {
  targetJob: "AI 产品运营实习生",
  questions: {
    whyYou: [
      question(
        "为什么你认为自己的经历适合 AI 产品运营岗位？",
        "结合 AI 公司经历、JobPulse 项目和信息资源管理背景，说明你对岗位核心职责的理解。",
        "岗位动机、经历关联、价值表达",
      ),
      question(
        "你为什么希望从内容与研究相关经历转向 AI 产品运营？",
        "说明方向变化背后的真实触发点，并连接你已经完成的实践。",
        "职业动机、方向判断",
      ),
      question(
        "在你的过往经历中，哪一段最能证明你可以推动 AI 产品相关工作落地？",
        "选择与岗位职责最接近的经历，用具体行动和结果证明。",
        "经历匹配、结果表达",
      ),
    ],
    experienceDeepDive: [
      question(
        "你在 ModelBest AI / OpenBMB 期间负责过哪些内容，其中最有价值的成果是什么？",
        "明确个人负责边界、协作对象、关键动作和可验证结果。",
        "项目深度、成果表达",
      ),
      question(
        "JobPulse 项目中，你如何从用户问题推导出产品功能与分析框架？",
        "说明需求拆解、方案选择和迭代判断过程。",
        "产品思维、逻辑策行力",
      ),
      question(
        "你在数据分析研究项目中使用了哪些方法，它们如何支持最终结论？",
        "聚焦数据来源、分析方法、关键发现和局限性。",
        "数据分析、严谨性",
      ),
      question(
        "你在跨团队协作经历中遇到过什么阻力，又是如何推进共识的？",
        "选择有明确冲突或不确定性的真实场景。",
        "沟通协作、项目推进",
      ),
    ],
    gapFollowUp: [
      question(
        "你缺少真实产品迭代经历，如果需要推动一个功能上线，你会如何开展工作？",
        "承认经验边界，同时给出需求确认、协作、验证和复盘路径。",
        "经历缺口、迁移能力",
      ),
      question(
        "你会如何在两周内建立对目标 AI 产品赛道的基础认知？",
        "给出信息来源、研究框架、实践验证和具体产出。",
        "行业认知、学习进化力",
      ),
      question(
        "如果面试官认为你的商业化分析经验不足，你会如何回应？",
        "用已有数据分析和用户理解经验说明相关能力证据，并给出补充计划。",
        "技能缺口、价值表达",
      ),
    ],
    starBehavioral: [
      question(
        "请讲一个你推动多个协作方完成复杂任务的经历。",
        "用 STAR 结构说明背景、任务、行动与结果，重点讲你的推动动作。",
        "跨团队协作",
      ),
      question(
        "请讲一个你快速学习陌生知识并完成交付的经历。",
        "说明学习路径、反馈机制和最终产出。",
        "快速学习",
      ),
      question(
        "请讲一个你拆解复杂问题并制定执行方案的经历。",
        "说明拆解依据、优先级判断和方案验证。",
        "解决复杂问题",
      ),
      question(
        "请讲一个你在时间压力下推进项目并控制风险的经历。",
        "说明如何排序任务、协调资源并保证交付质量。",
        "项目推进",
      ),
    ],
    stressQuestions: [
      question(
        "你不是产品或计算机科班出身，为什么能胜任这个岗位？",
        "先承认差异，再用迁移能力、学习速度和相关项目证据回应。",
        "背景质疑、应变表达",
      ),
      question(
        "你的经历方向较多，如何证明你对 AI 产品运营有清晰判断？",
        "提炼经历中的共同主线，说明每段经历如何推动方向确认。",
        "职业方向、叙事一致性",
      ),
      question(
        "如果入职后发现工作内容与预期不同，你会怎么处理？",
        "展示理解业务、主动沟通和适应变化的能力。",
        "稳定性、适应能力",
      ),
    ],
    englishQuestions: [
      question(
        "How did your experience at an AI company shape your interest in this role?",
        "用英文说明具体经历、关键认识和它与目标岗位的联系。",
        "英文表达、岗位动机",
      ),
      question(
        "Can you walk me through how you designed the JobPulse project?",
        "准备项目目标、关键决策、个人贡献和结果的英文表达。",
        "英文表达、项目深挖",
      ),
      question(
        "How would you quickly learn about an unfamiliar AI product market?",
        "用清晰步骤说明研究、验证和形成观点的方法。",
        "英文表达、快速学习",
      ),
    ],
  },
  priorityPreparation: [
    "准备一个能体现逻辑策行力的完整项目案例，明确说明判断依据与结果。",
    "整理 AI 公司经历和 JobPulse 项目的关键成果，形成两段可量化的面试叙事。",
    "补充目标岗位所在行业的基础知识，并准备 2 至 3 个有依据的行业观察。",
  ],
};

export const interviewQuestionGroups = toInterviewQuestionGroups(
  mockInterviewPackResult,
);

export const interviewPrioritySuggestions =
  mockInterviewPackResult.priorityPreparation;

export const totalInterviewQuestions = interviewQuestionGroups.reduce(
  (total, group) => total + group.questions.length,
  0,
);

export function toInterviewQuestionGroups(
  pack: InterviewPackResult,
): InterviewQuestionGroup[] {
  return [
    group("Why You", "岗位动机", "验证岗位动机、经历关联与个人价值表达。", "why-you", pack.questions.whyYou),
    group("Experience Deep Dive", "经历深挖", "追问真实项目、实习过程与成果证据。", "experience", pack.questions.experienceDeepDive),
    group("Gap Follow-up", "差距追问", "准备坦诚、具体地回应当前能力和经历短板。", "gap", pack.questions.gapFollowUp),
    group("STAR", "STAR 行为面试题", "用结构化案例证明通用职业能力与实际行动结果。", "star", pack.questions.starBehavioral),
    group("Pressure Questions", "压力面试题", "练习在质疑中保持稳定，并清晰表达自身价值。", "stress", pack.questions.stressQuestions),
    group("English Interview", "英文面试题", "准备贴近真实经历和岗位要求的英文表达。", "english", pack.questions.englishQuestions),
  ];
}

function question(
  value: string,
  hint: string,
  focus: string,
): GeneratedInterviewQuestion {
  return { question: value, hint, focus };
}

function group(
  eyebrow: string,
  title: string,
  description: string,
  idPrefix: string,
  questions: GeneratedInterviewQuestion[],
): InterviewQuestionGroup {
  return {
    eyebrow,
    title,
    description,
    questions: questions.map((item, index) => ({
      id: `${idPrefix}-${index + 1}`,
      question: item.question,
      guidanceLabel: item.focus || "准备提示",
      guidance: item.hint,
    })),
  };
}

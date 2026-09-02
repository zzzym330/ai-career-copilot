import type { GapAnalysisResult } from "@/types/gap-analysis";

export const mockGapAnalysisResult: GapAnalysisResult = {
  targetJob: "AI 产品运营实习生",
  summary:
    "你在沟通协作、表达呈现和学习进化方面具备较好基础，当前主要差距集中在逻辑策行、行业积累和部分岗位技能上。",
  careerDNAGap: [
    {
      dimension: "学习进化力",
      jobRequiredScore: 82,
      userScore: 86,
      status: "advantage",
      diff: 4,
      reason: "具备快速学习与适应新环境的基础。",
    },
    {
      dimension: "逻辑策行力",
      jobRequiredScore: 86,
      userScore: 74,
      status: "gap",
      diff: 12,
      reason: "缺少完整产品迭代和策略落地证据。",
    },
    {
      dimension: "沟通协作力",
      jobRequiredScore: 84,
      userScore: 88,
      status: "advantage",
      diff: 4,
      reason: "具备跨团队沟通与协作经历。",
    },
    {
      dimension: "自驱成长力",
      jobRequiredScore: 78,
      userScore: 82,
      status: "advantage",
      diff: 4,
      reason: "有主动发起项目和探索新方向的经历。",
    },
    {
      dimension: "行业积累力",
      jobRequiredScore: 80,
      userScore: 68,
      status: "gap",
      diff: 12,
      reason: "目标行业的业务实践深度仍需补充。",
    },
    {
      dimension: "表达呈现力",
      jobRequiredScore: 82,
      userScore: 90,
      status: "advantage",
      diff: 8,
      reason: "具备内容、品牌与研究成果表达经验。",
    },
  ],
  skillGap: {
    matched: ["SQL", "Excel", "Prompt Engineering", "AI Tools"],
    partial: ["PRD Writing", "User Research", "Data Analysis"],
    missing: ["A/B Testing", "产品指标体系", "商业化分析"],
  },
  experienceGap: {
    matchedExperience: [
      "AI 公司 / 实验室相关经历",
      "内容运营与品牌传播经历",
      "跨团队协作经历",
    ],
    highlightExperience: [
      "OpenBMB / ModelBest AI 经历",
      "JobPulse 项目经历",
      "数据分析研究经历",
    ],
    missingExperience: [
      "真实产品迭代经历",
      "商业化业务场景经历",
      "用户研究完整闭环经历",
    ],
  },
  industryGap: [
    "理解 AI 产品从用户需求到功能方案的基本逻辑",
    "熟悉大模型应用场景与常见产品形态",
    "能够将业务问题转化为可验证的产品或数据指标",
  ],
  priorityActions: [
    "补充一个完整的产品需求分析案例，用于证明逻辑策行力。",
    "系统学习目标岗位相关行业知识，例如 AI 产品或商业化业务。",
    "准备 2 个 STAR 案例，重点展示跨团队协作和项目推进能力。",
  ],
};

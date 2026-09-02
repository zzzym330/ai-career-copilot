import { callDeepSeekJson } from "@/lib/deepseek";
import type { GapAnalysisResult } from "@/types/gap-analysis";

export const runtime = "nodejs";

const instructions = `你是 JobPulse 的 Gap Analysis Agent。
你的任务是基于岗位画像（JD Analysis）和用户职业画像（Profile Builder），分析用户距离目标岗位还差什么。

不要输出匹配度百分比。重点解释用户有什么优势、有什么差距、为什么存在差距，以及应该优先补什么。

Career DNA 必须使用以下固定六维模型：
学习进化力、逻辑策行力、沟通协作力、自驱成长力、行业积累力、表达呈现力。
为目标岗位估算所需能力水平，再与用户画像对比。status 只能是 advantage、gap、balanced；diff 必须是绝对差值。

Skill Gap 分为 matched、partial、missing。
Experience Gap 分为 matchedExperience、highlightExperience、missingExperience。
Industry Gap 输出目标岗位相关行业知识缺口。
Priority Actions 最多 3 条，必须具体，不要输出“持续学习”“加强能力”“保持关注”等空话。

严格输出以下 JSON，不要输出 Markdown 或解释：
{
  "targetJob": "",
  "summary": "",
  "careerDNAGap": [
    {
      "dimension": "",
      "jobRequiredScore": 0,
      "userScore": 0,
      "status": "advantage | gap | balanced",
      "diff": 0,
      "reason": ""
    }
  ],
  "skillGap": { "matched": [], "partial": [], "missing": [] },
  "experienceGap": {
    "matchedExperience": [],
    "highlightExperience": [],
    "missingExperience": []
  },
  "industryGap": [],
  "priorityActions": []
}`;

export async function POST(request: Request) {
  let body: { jdAnalysis?: unknown; profile?: unknown };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("请求格式无效。", 400);
  }

  if (!isRecord(body.jdAnalysis) || !isRecord(body.profile)) {
    return errorResponse("缺少 JD 解译结果或职业画像。", 400);
  }

  try {
    const value = await callDeepSeekJson<unknown>(
      [
        { role: "system", content: instructions },
        {
          role: "user",
          content: JSON.stringify({
            jdAnalysis: body.jdAnalysis,
            profile: body.profile,
          }),
        },
      ],
      { maxTokens: 4_000 },
    );

    return Response.json(parseGapAnalysis(value));
  } catch (error) {
    console.error("Gap analysis failed:", error);
    return errorResponse("AI 生成失败，请使用示例结果。", 502);
  }
}

function parseGapAnalysis(value: unknown): GapAnalysisResult {
  if (
    !isRecord(value) ||
    !isString(value.targetJob) ||
    !isString(value.summary) ||
    !isCareerDnaGap(value.careerDNAGap) ||
    !isStringGroup(value.skillGap, ["matched", "partial", "missing"]) ||
    !isStringGroup(value.experienceGap, [
      "matchedExperience",
      "highlightExperience",
      "missingExperience",
    ]) ||
    !isStringArray(value.industryGap) ||
    !isStringArray(value.priorityActions) ||
    value.priorityActions.length === 0 ||
    value.priorityActions.length > 3
  ) {
    throw new Error("DeepSeek 返回内容不符合 Gap Analysis 结构。");
  }

  return value as GapAnalysisResult;
}

function isCareerDnaGap(value: unknown) {
  const requiredDimensions = new Set([
    "学习进化力",
    "逻辑策行力",
    "沟通协作力",
    "自驱成长力",
    "行业积累力",
    "表达呈现力",
  ]);

  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every(
      (item) =>
        isRecord(item) &&
        isString(item.dimension) &&
        requiredDimensions.has(item.dimension) &&
        isScore(item.jobRequiredScore) &&
        isScore(item.userScore) &&
        (item.status === "advantage" ||
          item.status === "gap" ||
          item.status === "balanced") &&
        typeof item.diff === "number" &&
        item.diff >= 0 &&
        isString(item.reason),
    )
  );
}

function isStringGroup(value: unknown, keys: string[]) {
  return isRecord(value) && keys.every((key) => isStringArray(value[key]));
}

function isScore(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 100;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

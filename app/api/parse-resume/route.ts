import { callDeepSeekJson } from "@/lib/deepseek";
import type { ParsedResumeResult } from "@/types/profile";

export const runtime = "nodejs";

const MAX_RESUME_LENGTH = 30_000;

const instructions = `你是 JobPulse 的职业画像解析 Agent。
请根据用户简历文本生成结构化职业画像。
提取教育背景、实习经历、项目经历、技能、语言能力，并基于 JobPulse Career DNA 六维模型评估用户通用职业能力。

JobPulse Career DNA 六维模型：
1. learningAgility 学习进化力：获取新知识、适应新环境、解决未知问题的速度与效率。
2. strategicExecution 逻辑策行力：拆解复杂问题、制定策略并推动落地的能力。
3. communication 沟通协作力：跨团队协作、影响他人、推动共识的能力。
4. selfDrivenGrowth 自驱成长力：主动学习、主动探索、自我驱动成长的能力。
5. industryExposure 行业积累力：在目标行业或相关领域的实践积累与认知深度。
6. valueCommunication 表达呈现力：通过文字或语言清晰表达成果与价值的能力。

不要编造不存在的经历。信息不足时使用空数组或“信息不足”。
Career DNA 分数必须基于简历证据，范围为 0-100。
教育字段使用 school、degree、focus。
实习字段使用 company、role、description。
项目字段使用 name、role、description。

严格输出以下 JSON，不要输出 Markdown 或解释：
{
  "education": [],
  "internships": [],
  "projects": [],
  "skills": [],
  "languages": [],
  "careerDNA": {
    "learningAgility": 0,
    "strategicExecution": 0,
    "communication": 0,
    "selfDrivenGrowth": 0,
    "industryExposure": 0,
    "valueCommunication": 0
  },
  "strengths": [],
  "transferableSkills": [],
  "growthAreas": [],
  "summary": ""
}`;

export async function POST(request: Request) {
  let resumeText = "";

  try {
    const body = (await request.json()) as { resumeText?: unknown };
    resumeText =
      typeof body.resumeText === "string" ? body.resumeText.trim() : "";
  } catch {
    return errorResponse("请求格式无效，请重新提交简历文本。", 400);
  }

  if (!resumeText) {
    return errorResponse("请先粘贴简历文本。", 400);
  }

  if (resumeText.length > MAX_RESUME_LENGTH) {
    return errorResponse(`简历文本不能超过 ${MAX_RESUME_LENGTH} 个字符。`, 400);
  }

  try {
    const result = await callDeepSeekJson<unknown>(
      [
        { role: "system", content: instructions },
        { role: "user", content: resumeText },
      ],
      { maxTokens: 3_500 },
    );

    return Response.json(parseResumeResult(result));
  } catch (error) {
    console.error("Resume parsing failed:", error);
    const message =
      error instanceof Error && error.message.includes("DEEPSEEK_API_KEY")
        ? "未配置 DEEPSEEK_API_KEY，无法使用 AI 简历解析。"
        : "AI 简历解析失败，请稍后重试。";
    return errorResponse(message, 502);
  }
}

function parseResumeResult(value: unknown): ParsedResumeResult {
  if (
    !isRecord(value) ||
    !isEducationArray(value.education) ||
    !isInternshipArray(value.internships) ||
    !isProjectArray(value.projects) ||
    !isStringArray(value.skills) ||
    !isStringArray(value.languages) ||
    !isCareerDna(value.careerDNA) ||
    !isStringArray(value.strengths) ||
    !isStringArray(value.transferableSkills) ||
    !isStringArray(value.growthAreas) ||
    !isString(value.summary)
  ) {
    throw new Error("DeepSeek 返回内容不符合职业画像结构。");
  }

  return value as ParsedResumeResult;
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isEducationArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => hasStrings(item, ["school", "degree", "focus"]));
}

function isInternshipArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => hasStrings(item, ["company", "role", "description"]));
}

function isProjectArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => hasStrings(item, ["name", "role", "description"]));
}

function hasStrings(value: unknown, keys: string[]) {
  return isRecord(value) && keys.every((key) => isString(value[key]));
}

function isCareerDna(value: unknown) {
  const keys = [
    "learningAgility",
    "strategicExecution",
    "communication",
    "selfDrivenGrowth",
    "industryExposure",
    "valueCommunication",
  ];
  return isRecord(value) && keys.every((key) => isScore(value[key]));
}

function isScore(value: unknown) {
  return typeof value === "number" && value >= 0 && value <= 100;
}

import { callDeepSeekJson } from "@/lib/deepseek";
import type { InterviewPackResult } from "@/types/interview";

export const runtime = "nodejs";

const instructions = `你是 JobPulse 的 Interview Generator Agent。
根据岗位要求、用户职业画像和 Gap Analysis 生成个性化面试题。

不要生成通用题库，也不要生成“请自我介绍”“你的优缺点是什么”等模板题。
优先基于用户真实经历、真实项目和能力缺口生成追问。

题目数量必须为：
whyYou 1 题；experienceDeepDive 2 题；gapFollowUp 1 题；starBehavioral 2 题；stressQuestions 1 题；englishQuestions 1 题。
每题输出 question、hint、focus。
English Questions 的 question 使用英文，hint 使用中文，不要生成标准答案。
priorityPreparation 最多 3 条，具体说明最应该准备什么。

输出必须精炼：
- 严格遵守 JSON schema，不要新增、删除或重命名字段。
- question 只输出一句简洁问题，控制在 35 字以内；英文问题控制在 25 个英文单词以内。
- hint 只输出 1 句话，控制在 45 字以内，不要写完整答案。
- focus 使用 2 到 4 个短标签，用顿号分隔。
- priorityPreparation 每条控制在 35 字以内。
- 不要重复 JD、简历或 Gap Analysis 中的大段原文。
- 每个字段只输出完成前端展示所需的最少信息，禁止长篇解释。
- 不输出 Markdown、代码块或额外解释文字。

严格输出以下 JSON，不要输出 Markdown 或解释：
{
  "targetJob": "",
  "questions": {
    "whyYou": [],
    "experienceDeepDive": [],
    "gapFollowUp": [],
    "starBehavioral": [],
    "stressQuestions": [],
    "englishQuestions": []
  },
  "priorityPreparation": []
}`;

export async function POST(request: Request) {
  let body: {
    jdAnalysis?: unknown;
    profile?: unknown;
    gapAnalysis?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("请求格式无效。", 400);
  }

  if (
    !isRecord(body.jdAnalysis) ||
    !isRecord(body.profile) ||
    !isRecord(body.gapAnalysis)
  ) {
    return errorResponse("缺少 JD、职业画像或差距分析结果。", 400);
  }

  try {
    const value = await callDeepSeekJson<unknown>(
      [
        { role: "system", content: instructions },
        {
          role: "user",
          content: JSON.stringify(
            compactInterviewContext(
              body.jdAnalysis,
              body.profile,
              body.gapAnalysis,
            ),
          ),
        },
      ],
      { maxTokens: 6_000 },
    );

    return Response.json(parseInterviewPack(value));
  } catch (error) {
    console.error("Interview generation failed:", error);
    return errorResponse("AI 生成失败，请使用示例结果。", 502);
  }
}

function parseInterviewPack(value: unknown): InterviewPackResult {
  if (
    !isRecord(value) ||
    !isString(value.targetJob) ||
    !isRecord(value.questions) ||
    !isQuestionArray(value.questions.whyYou, 1) ||
    !isQuestionArray(value.questions.experienceDeepDive, 2) ||
    !isQuestionArray(value.questions.gapFollowUp, 1) ||
    !isQuestionArray(value.questions.starBehavioral, 2) ||
    !isQuestionArray(value.questions.stressQuestions, 1) ||
    !isQuestionArray(value.questions.englishQuestions, 1) ||
    !isStringArray(value.priorityPreparation) ||
    value.priorityPreparation.length === 0 ||
    value.priorityPreparation.length > 3
  ) {
    throw new Error("DeepSeek 返回内容不符合 Interview Pack 结构。");
  }

  return value as InterviewPackResult;
}

function compactInterviewContext(
  jdAnalysis: unknown,
  profile: unknown,
  gapAnalysis: unknown,
) {
  return {
    jdAnalysis: compactJdAnalysis(jdAnalysis),
    profile: compactProfile(profile),
    gapAnalysis: compactGapAnalysis(gapAnalysis),
  };
}

function compactJdAnalysis(value: unknown) {
  if (!isRecord(value)) return value;

  return {
    jobTitle: getString(value, "jobTitle", 80),
    thresholdLevel: isRecord(value.threshold)
      ? getString(value.threshold, "level", 20)
      : getString(value, "jobThresholdLevel", 20),
    thresholdReason: isRecord(value.threshold)
      ? getString(value.threshold, "reason", 140)
      : getString(value, "thresholdReason", 140),
    responsibilities: getStringArray(value, "responsibilities", 5, 80),
    skills:
      getStringArray(value, "skills", 8, 40).length > 0
        ? getStringArray(value, "skills", 8, 40)
        : getStringArray(value, "coreSkills", 8, 40),
    jobProfile:
      getString(value, "jobProfile", 160) ?? getString(value, "jobPersona", 160),
  };
}

function compactProfile(value: unknown) {
  if (!isRecord(value)) return value;

  return {
    targetDirections: getRecordArray(
      value,
      "targetDirections",
      ["category", "role"],
      3,
      40,
    ),
    education: getRecordArray(
      value,
      "education",
      ["school", "degree", "focus"],
      2,
      60,
    ),
    internships: getRecordArray(
      value,
      "internships",
      ["company", "role", "description"],
      3,
      90,
    ),
    projects: getRecordArray(
      value,
      "projects",
      ["name", "role", "description"],
      3,
      90,
    ),
    skills: getStringArray(value, "skills", 12, 40),
    languages: getStringArray(value, "languages", 5, 30),
    careerDNA: isRecord(value.careerDNA) ? value.careerDNA : undefined,
    strengths: getStringArray(value, "strengths", 5, 70),
    growthAreas: getStringArray(value, "growthAreas", 5, 70),
    summary: getString(value, "summary", 140),
  };
}

function compactGapAnalysis(value: unknown) {
  if (!isRecord(value)) return value;

  return {
    targetJob: getString(value, "targetJob", 80),
    summary: getString(value, "summary", 140),
    careerDNAGap: Array.isArray(value.careerDNAGap)
      ? value.careerDNAGap.slice(0, 6).map((item) => {
          if (!isRecord(item)) return item;
          return {
            dimension: getString(item, "dimension", 30),
            status: getString(item, "status", 20),
            diff: item.diff,
            reason: getString(item, "reason", 80),
          };
        })
      : [],
    skillGap: compactStringGroups(value.skillGap, [
      "matched",
      "partial",
      "missing",
    ]),
    experienceGap: compactStringGroups(value.experienceGap, [
      "matchedExperience",
      "highlightExperience",
      "missingExperience",
    ]),
    industryGap: getStringArray(value, "industryGap", 5, 60),
    priorityActions: getStringArray(value, "priorityActions", 3, 70),
  };
}

function compactStringGroups(value: unknown, keys: string[]) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    keys.map((key) => [key, getStringArray(value, key, 5, 60)]),
  );
}

function getString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = record[key];
  return isString(value) ? trimText(value, maxLength) : undefined;
}

function getStringArray(
  record: Record<string, unknown>,
  key: string,
  maxItems: number,
  maxLength: number,
) {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value.filter(isString).slice(0, maxItems).map((item) => trimText(item, maxLength));
}

function getRecordArray(
  record: Record<string, unknown>,
  key: string,
  fields: string[],
  maxItems: number,
  maxLength: number,
) {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .slice(0, maxItems)
    .map((item) =>
      Object.fromEntries(
        fields.map((field) => [field, getString(item, field, maxLength)]),
      ),
    );
}

function trimText(value: string, maxLength: number) {
  const normalized = value.trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}…`
    : normalized;
}

function isQuestionArray(value: unknown, length: number) {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every(
      (item) =>
        isRecord(item) &&
        isString(item.question) &&
        isString(item.hint) &&
        isString(item.focus),
    )
  );
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

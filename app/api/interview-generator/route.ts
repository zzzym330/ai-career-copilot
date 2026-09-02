import { callDeepSeekJson } from "@/lib/deepseek";
import type { InterviewPackResult } from "@/types/interview";

export const runtime = "nodejs";

const instructions = `你是 JobPulse 的 Interview Generator Agent。
根据岗位要求、用户职业画像和 Gap Analysis 生成个性化面试题。

不要生成通用题库，也不要生成“请自我介绍”“你的优缺点是什么”等模板题。
优先基于用户真实经历、真实项目和能力缺口生成追问。

题目数量必须为：
whyYou 3 题；experienceDeepDive 4 题；gapFollowUp 3 题；starBehavioral 4 题；stressQuestions 3 题；englishQuestions 3 题。
每题输出 question、hint、focus。
English Questions 的 question 使用英文，hint 使用中文，不要生成标准答案。
priorityPreparation 最多 3 条，具体说明最应该准备什么。

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
          content: JSON.stringify({
            jdAnalysis: body.jdAnalysis,
            profile: body.profile,
            gapAnalysis: body.gapAnalysis,
          }),
        },
      ],
      { maxTokens: 5_000 },
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
    !isQuestionArray(value.questions.whyYou, 3) ||
    !isQuestionArray(value.questions.experienceDeepDive, 4) ||
    !isQuestionArray(value.questions.gapFollowUp, 3) ||
    !isQuestionArray(value.questions.starBehavioral, 4) ||
    !isQuestionArray(value.questions.stressQuestions, 3) ||
    !isQuestionArray(value.questions.englishQuestions, 3) ||
    !isStringArray(value.priorityPreparation) ||
    value.priorityPreparation.length === 0 ||
    value.priorityPreparation.length > 3
  ) {
    throw new Error("DeepSeek 返回内容不符合 Interview Pack 结构。");
  }

  return value as InterviewPackResult;
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

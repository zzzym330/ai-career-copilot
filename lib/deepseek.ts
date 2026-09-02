export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

export async function callDeepSeekJson<T>(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {},
): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY。");
  }

  const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.2,
      response_format: { type: "json_object" },
      max_tokens: options.maxTokens ?? 2_000,
      stream: false,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek 请求失败：${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const content = extractMessageContent(payload);

  try {
    return JSON.parse(stripMarkdownCodeBlock(content)) as T;
  } catch {
    throw new Error("DeepSeek 返回内容不是有效 JSON。");
  }
}

function extractMessageContent(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new Error("DeepSeek 返回中缺少 choices。");
  }

  for (const choice of payload.choices) {
    if (
      isRecord(choice) &&
      isRecord(choice.message) &&
      typeof choice.message.content === "string"
    ) {
      return choice.message.content;
    }
  }

  throw new Error("DeepSeek 返回中缺少 message content。");
}

function stripMarkdownCodeBlock(content: string) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

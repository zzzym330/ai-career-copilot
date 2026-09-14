export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  disableThinking?: boolean;
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

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequestBody(messages, options, attempt)),
      signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
    });

    if (!response.ok) {
      logDeepSeekDebug("request failed", {
        attempt,
        status: response.status,
        body: (await response.text()).slice(0, 1_000),
      });
      throw new Error(`DeepSeek 请求失败：${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const result = extractMessageResult(payload);
    const content = result.content.trim();

    logDeepSeekDebug("raw message content", {
      attempt,
      finishReason: result.finishReason,
      contentLength: content.length,
      usage: result.usage,
      preview: content.slice(0, 1_000),
    });

    if (result.finishReason === "length") {
      throw new Error("DeepSeek 输出被截断，请提高 max_tokens 后重试。");
    }

    if (!content) {
      if (attempt === 1) {
        logDeepSeekDebug("empty content retrying", { attempt });
        continue;
      }

      throw new Error("DeepSeek 返回空内容，重试后仍未获得有效结果。");
    }

    try {
      return JSON.parse(stripMarkdownCodeBlock(content)) as T;
    } catch (error) {
      logDeepSeekDebug("invalid JSON content", {
        attempt,
        parseError: error instanceof Error ? error.message : String(error),
        preview: content.slice(0, 1_000),
      });
      throw new Error("DeepSeek 返回内容不是有效 JSON。");
    }
  }

  throw new Error("DeepSeek 返回空内容，重试后仍未获得有效结果。");
}

function createRequestBody(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions,
  attempt: number,
) {
  const retryMessage: DeepSeekMessage = {
    role: "user",
    content:
      "必须直接输出非空的合法 JSON 对象，不要返回空内容，不要输出 Markdown、代码块或解释文字。",
  };

  return {
    model: options.model ?? DEFAULT_MODEL,
    messages: attempt === 1 ? messages : [...messages, retryMessage],
    temperature: options.temperature ?? 0.2,
    response_format: { type: "json_object" },
    max_tokens: options.maxTokens ?? 2_000,
    stream: false,
    ...(options.disableThinking ? { thinking: { type: "disabled" } } : {}),
  };
}

function extractMessageResult(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new Error("DeepSeek 返回中缺少 choices。");
  }

  for (const choice of payload.choices) {
    if (
      isRecord(choice) &&
      isRecord(choice.message) &&
      typeof choice.message.content === "string"
    ) {
      return {
        content: choice.message.content,
        finishReason:
          typeof choice.finish_reason === "string"
            ? choice.finish_reason
            : null,
        usage: isRecord(payload.usage) ? payload.usage : null,
      };
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

function logDeepSeekDebug(message: string, detail: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[deepseek] ${message}`, detail);
  }
}

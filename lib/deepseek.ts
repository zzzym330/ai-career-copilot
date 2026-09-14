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

type DeepSeekRetryReason = "empty-content" | "invalid-json" | "length" | null;

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

  const baseMaxTokens = options.maxTokens ?? 2_000;
  let retryReason: DeepSeekRetryReason = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const currentMaxTokens = getAttemptMaxTokens(baseMaxTokens, retryReason);

    const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        createRequestBody(messages, options, attempt, retryReason),
      ),
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
      maxTokens: currentMaxTokens,
      contentLength: content.length,
      usage: result.usage,
      preview: content.slice(0, 1_000),
    });

    if (result.finishReason === "length") {
      if (attempt === 1) {
        const nextMaxTokens = getAttemptMaxTokens(baseMaxTokens, "length");
        logDeepSeekDiagnostic(
          "output truncated, retrying with higher max_tokens",
          {
            attempt,
            maxTokens: currentMaxTokens,
            nextMaxTokens,
            finishReason: result.finishReason,
          },
        );
        retryReason = "length";
        continue;
      }

      throw new Error("DeepSeek 输出被截断，请提高 max_tokens 后重试。");
    }

    if (!content) {
      if (attempt === 1) {
        logDeepSeekDebug("empty content retrying", {
          attempt,
          maxTokens: currentMaxTokens,
          finishReason: result.finishReason,
        });
        retryReason = "empty-content";
        continue;
      }

      throw new Error("DeepSeek 返回空内容，重试后仍未获得有效结果。");
    }

    try {
      return JSON.parse(stripMarkdownCodeBlock(content)) as T;
    } catch (error) {
      logDeepSeekDiagnostic("invalid JSON content", {
        attempt,
        finishReason: result.finishReason,
        contentLength: content.length,
        parseError: error instanceof Error ? error.message : String(error),
        preview: content.slice(0, 1_000),
      });

      if (attempt === 1) {
        retryReason = "invalid-json";
        continue;
      }

      throw new Error("DeepSeek 返回内容不是有效 JSON。");
    }
  }

  throw new Error("DeepSeek 返回空内容，重试后仍未获得有效结果。");
}

function createRequestBody(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions,
  attempt: number,
  retryReason: DeepSeekRetryReason,
) {
  const retryMessage = createRetryMessage(retryReason);

  return {
    model: options.model ?? DEFAULT_MODEL,
    messages: attempt === 1 || !retryMessage ? messages : [...messages, retryMessage],
    temperature: options.temperature ?? 0.2,
    response_format: { type: "json_object" },
    max_tokens: getAttemptMaxTokens(options.maxTokens ?? 2_000, retryReason),
    stream: false,
    ...(options.disableThinking ? { thinking: { type: "disabled" } } : {}),
  };
}

function getAttemptMaxTokens(
  baseMaxTokens: number,
  retryReason: DeepSeekRetryReason,
) {
  if (retryReason !== "length") {
    return baseMaxTokens;
  }

  return Math.ceil(Math.max(baseMaxTokens * 1.5, 6_000));
}

function createRetryMessage(
  retryReason: DeepSeekRetryReason,
): DeepSeekMessage | null {
  if (!retryReason) {
    return null;
  }

  if (retryReason === "length") {
    return {
      role: "user",
      content:
        "上一次输出被截断。请在不改变 JSON 字段结构的前提下精炼输出：只返回合法 JSON object，不输出 Markdown、代码块或解释文字；严格遵守 JSON schema；控制数组中每项文字长度；不要为了详细而生成过长文本。",
    };
  }

  return {
    role: "user",
    content:
      "必须直接输出非空的合法 JSON 对象，不要返回空内容，不要输出 Markdown、代码块或解释文字。",
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

function logDeepSeekDiagnostic(message: string, detail: unknown) {
  console.warn(`[deepseek] ${message}`, detail);
}

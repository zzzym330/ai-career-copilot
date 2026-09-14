import { callDeepSeekJson } from "@/lib/deepseek";
import { inflateRawSync, inflateSync } from "node:zlib";
import type { ParsedResumeResult } from "@/types/profile";

export const runtime = "nodejs";

const MAX_RESUME_LENGTH = 30_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const instructions = `你是 JobPulse 的职业画像解析 Agent。
你是一个面向中文求职者的简历结构化助手。除 JSON key 外，所有面向用户展示的文本内容默认使用简体中文。
公司名、学校名、实验室名、组织名、项目名等实体名称，必须优先严格保留原简历中的原始写法。
如果实体名称原文是中文，禁止主动翻译成英文，禁止替换成所谓官方英文名、品牌英文名或英文缩写，不要为了标准化、美化或国际化而改变原文实体名称。
例如：原文“百川智能”必须输出“百川智能”；原文“面壁智能”必须输出“面壁智能”；原文“清华 OpenBMB 实验室”必须输出“清华 OpenBMB 实验室”。
只有原文本身就是英文，或该专有名词本身通常只使用英文时，才保留英文，例如 Python、SAP、API、SQL、Next.js。
除上述专有名词外，职位名称、经历描述、研究方向、项目描述等面向用户展示的内容默认使用简体中文；请尽量保留原简历中的中文表达，并在结构化过程中做必要精炼。
请根据用户简历文本生成结构化职业画像。
提取教育背景、实习经历、项目经历、技能、语言能力，并基于 JobPulse Career DNA 六维模型评估用户通用职业能力。

输出格式要求：
必须返回 JSON。
只能返回一个非空的合法 JSON object。
不要输出 Markdown。
不要输出 \`\`\`json 代码块。
不要输出解释文字。
不允许返回空内容。
必须严格按照给定 schema 输出，字段名、嵌套结构和数据类型必须与示例一致。
数组字段必须返回数组；没有信息时返回空数组，不要省略字段。

JobPulse Career DNA 六维模型：
1. learningAgility 学习进化力：获取新知识、适应新环境、解决未知问题的速度与效率。
2. strategicExecution 逻辑策行力：拆解复杂问题、制定策略并推动落地的能力。
3. communication 沟通协作力：跨团队协作、影响他人、推动共识的能力。
4. selfDrivenGrowth 自驱成长力：主动学习、主动探索、自我驱动成长的能力。
5. industryExposure 行业积累力：在目标行业或相关领域的实践积累与认知深度。
6. valueCommunication 表达呈现力：通过文字或语言清晰表达成果与价值的能力。

不要编造不存在的经历。信息不足时使用空数组或“信息不足”。
Career DNA 分数必须基于简历证据，范围为 0-100。
教育字段使用 school、degree、focus，字段值使用简体中文为主，例如“西北大学”“图书情报硕士”“研究方向：信息计量、数据科学”。
实习字段使用 company、role、description，字段值使用简体中文为主，例如“品牌与公关运营实习生”“负责 AI 相关内容生产与品牌传播支持”。
项目字段使用 name、role、description，字段值使用简体中文为主，例如“AI 求职智能平台”“负责 JD 解译、职业画像与差距分析流程设计”。

严格输出以下 JSON schema。下面是结构示例，实际内容必须基于用户简历生成：
{
  "education": [
    {
      "school": "西北大学",
      "degree": "图书情报硕士",
      "focus": "研究方向：信息计量、数据科学"
    }
  ],
  "internships": [
    {
      "company": "百川智能",
      "role": "政府事务实习生",
      "description": "支持政府接待、会议协调与跨部门沟通工作。"
    }
  ],
  "projects": [
    {
      "name": "JobPulse",
      "role": "AI 职业智能平台",
      "description": "负责 JD 解译、职业画像与差距分析流程设计。"
    }
  ],
  "skills": ["SQL", "Python", "Prompt Engineering"],
  "languages": ["中文", "英语"],
  "careerDNA": {
    "learningAgility": 82,
    "strategicExecution": 76,
    "communication": 85,
    "selfDrivenGrowth": 80,
    "industryExposure": 74,
    "valueCommunication": 88
  },
  "strengths": ["具备 AI 行业相关实习经历", "具备内容表达与跨团队沟通基础"],
  "transferableSkills": ["信息整理与分析", "用户需求理解", "项目推进"],
  "growthAreas": ["产品指标理解", "SQL 数据分析深度", "面试项目表达"],
  "summary": "具备 AI 行业实习经历、信息管理背景和基础数据分析能力，适合继续探索 AI 产品、产品运营和内容策略相关方向。"
}`;

export async function POST(request: Request) {
  try {
    const resumeText = await readResumeText(request);
    logResumeParserDebug("extracted resume text", {
      length: resumeText.length,
      preview: createTextPreview(resumeText),
    });

    if (!resumeText) {
      logResumeParserDebug("empty resume text");
      return errorResponse("请先提交简历内容。", 400);
    }

    if (resumeText.length > MAX_RESUME_LENGTH) {
      return errorResponse(`简历文本不能超过 ${MAX_RESUME_LENGTH} 个字符。`, 400);
    }

    const result = await callDeepSeekJson<unknown>(
      [
        { role: "system", content: instructions },
        { role: "user", content: resumeText },
      ],
      { disableThinking: true, maxTokens: 5_000 },
    );
    logResumeParserDebug("DeepSeek JSON parsed", {
      keys: isRecord(result) ? Object.keys(result) : typeof result,
    });

    return Response.json(parseResumeResult(result));
  } catch (error) {
    logResumeParserError(error);
    if (error instanceof ResumeParseError) {
      return errorResponse(error.message, error.status);
    }

    const message = getAiErrorMessage(error);
    return errorResponse(message, 502);
  }
}

function getAiErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "AI 简历解析失败，请稍后重试。";
  }

  if (error.message.includes("DEEPSEEK_API_KEY")) {
    return "未配置 DEEPSEEK_API_KEY，无法使用 AI 简历解析。";
  }

  if (
    error.message.includes("不是有效 JSON") ||
    error.message.includes("不符合职业画像结构")
  ) {
    return "AI 返回内容无法解析为职业画像，请稍后重试。";
  }

  if (error.message.includes("DeepSeek 请求失败")) {
    return "DeepSeek API 请求失败，请稍后重试。";
  }

  return "AI 简历解析失败，请稍后重试。";
}

async function readResumeText(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("resumeFile");

    if (!(file instanceof File) || file.size === 0) {
      throw new ResumeParseError("请先上传 PDF 或 DOCX 简历文件。", 400);
    }

    return extractResumeFileText(file);
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { resumeText?: unknown };
    return typeof body.resumeText === "string" ? body.resumeText.trim() : "";
  }

  throw new ResumeParseError("请求格式无效，请重新提交简历。", 400);
}

async function extractResumeFileText(file: File) {
  validateResumeFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = getFileExtension(file.name);
  const text =
    extension === "pdf" ? extractPdfText(buffer) : extractDocxText(buffer);
  const normalized = normalizeExtractedText(text);

  if (!normalized) {
    throw new ResumeParseError(
      "未能从该文件中识别到有效文本，请尝试上传可复制文字的 PDF / DOCX，或切换为“粘贴简历文本”。",
      400,
    );
  }

  return normalized;
}

function createTextPreview(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 240);
}

function logResumeParserDebug(message: string, detail?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[parse-resume] ${message}`, detail ?? "");
  }
}

function logResumeParserError(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[parse-resume] failed", error);
  }
}

function validateResumeFile(file: File) {
  const extension = getFileExtension(file.name);

  if (extension !== "pdf" && extension !== "docx") {
    throw new ResumeParseError("仅支持 PDF 或 DOCX 文件。", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ResumeParseError("文件大小不能超过 10MB。", 400);
  }
}

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function extractPdfText(buffer: Buffer) {
  const content = buffer.toString("latin1");
  const streamTexts: string[] = [];
  const streamRegex = /<<(.*?)>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content))) {
    const dictionary = match[1];
    const streamContent = match[2];
    let streamBuffer = Buffer.from(streamContent, "latin1");

    if (dictionary.includes("/FlateDecode")) {
      try {
        streamBuffer = inflateSync(streamBuffer);
      } catch {
        try {
          streamBuffer = inflateRawSync(streamBuffer);
        } catch {
          continue;
        }
      }
    }

    streamTexts.push(extractPdfContentText(streamBuffer.toString("latin1")));
  }

  streamTexts.push(extractPdfContentText(content));
  return streamTexts.join("\n");
}

function extractPdfContentText(content: string) {
  const texts: string[] = [];

  for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    texts.push(decodePdfLiteralString(match[0].replace(/\)\s*Tj$/, "").slice(1)));
  }

  for (const match of content.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    const values = match[1].match(/\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>/g) ?? [];
    texts.push(values.map(decodePdfToken).join(""));
  }

  for (const match of content.matchAll(/<([\da-fA-F\s]+)>\s*Tj/g)) {
    texts.push(decodePdfHexString(match[1]));
  }

  return texts.join(" ");
}

function decodePdfToken(token: string) {
  return token.startsWith("<")
    ? decodePdfHexString(token.slice(1, -1))
    : decodePdfLiteralString(token.slice(1, -1));
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\\r?\n/g, "");
}

function decodePdfHexString(value: string) {
  const hex = value.replace(/\s/g, "");
  const bytes = Buffer.from(hex.length % 2 === 0 ? hex : `${hex}0`, "hex");

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const chars: string[] = [];
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      chars.push(String.fromCharCode(bytes.readUInt16BE(index)));
    }
    return chars.join("");
  }

  return bytes.toString("utf8");
}

function extractDocxText(buffer: Buffer) {
  const xml = readZipEntry(buffer, "word/document.xml");

  if (!xml) {
    throw new ResumeParseError("无法读取 DOCX 文件内容，请确认文件未损坏。", 400);
  }

  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tab>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function readZipEntry(buffer: Buffer, entryName: string) {
  const eocdOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

  if (eocdOffset === -1) {
    throw new ResumeParseError("无法读取 DOCX 文件内容，请确认文件未损坏。", 400);
  }

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralDirectoryOffset;
  const endOffset = centralDirectoryOffset + centralDirectorySize;

  while (offset < endOffset && buffer.readUInt32LE(offset) === 0x02014b50) {
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const filename = buffer
      .subarray(offset + 46, offset + 46 + filenameLength)
      .toString("utf8");

    if (filename === entryName) {
      const localFilenameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart =
        localHeaderOffset + 30 + localFilenameLength + localExtraLength;
      const compressedData = buffer.subarray(
        dataStart,
        dataStart + compressedSize,
      );
      const data =
        compressionMethod === 0
          ? compressedData
          : inflateRawSync(compressedData);

      return data.toString("utf8");
    }

    offset += 46 + filenameLength + extraLength + commentLength;
  }

  return null;
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

class ResumeParseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function parseResumeResult(value: unknown): ParsedResumeResult {
  const schemaIssues = getResumeResultSchemaIssues(value);

  if (schemaIssues.length > 0) {
    logResumeParserDebug("schema mismatch", schemaIssues);
    throw new Error("DeepSeek 返回内容不符合职业画像结构。");
  }

  return value as ParsedResumeResult;
}

function getResumeResultSchemaIssues(value: unknown) {
  if (!isRecord(value)) {
    return ["root is not an object"];
  }

  const issues: string[] = [];

  if (!isEducationArray(value.education)) {
    issues.push("education must be an array of { school, degree, focus }");
  }
  if (!isInternshipArray(value.internships)) {
    issues.push(
      "internships must be an array of { company, role, description }",
    );
  }
  if (!isProjectArray(value.projects)) {
    issues.push("projects must be an array of { name, role, description }");
  }
  if (!isStringArray(value.skills)) {
    issues.push("skills must be a string array");
  }
  if (!isStringArray(value.languages)) {
    issues.push("languages must be a string array");
  }
  if (!isCareerDna(value.careerDNA)) {
    issues.push("careerDNA is missing or contains invalid scores");
  }
  if (!isStringArray(value.strengths)) {
    issues.push("strengths must be a string array");
  }
  if (!isStringArray(value.transferableSkills)) {
    issues.push("transferableSkills must be a string array");
  }
  if (!isStringArray(value.growthAreas)) {
    issues.push("growthAreas must be a string array");
  }
  if (!isString(value.summary)) {
    issues.push("summary must be a string");
  }

  return issues;
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

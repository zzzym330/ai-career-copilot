import { ContentSection } from "@/components/AppShell";

type ResumeUploaderProps = {
  file: File | null;
  inputMode: InputMode;
  isRecognizing: boolean;
  onFileChange: (file: File | null) => void;
  onInputModeChange: (mode: InputMode) => void;
  onRecognize: () => void;
  onResumeTextChange: (value: string) => void;
  resumeText: string;
};

type InputMode = "file" | "text";

export function ResumeUploader({
  file,
  inputMode,
  isRecognizing,
  onFileChange,
  onInputModeChange,
  onRecognize,
  onResumeTextChange,
  resumeText,
}: ResumeUploaderProps) {
  return (
    <ContentSection compact className="w-full">
      <div className="max-w-2xl">
        <p className="text-[10px] font-medium uppercase leading-4 tracking-[0.16em] text-neutral-400">
          Step 1
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-6 text-neutral-950">
          上传简历
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-neutral-500">
          选择一种方式导入你的简历，AI 将自动识别简历内容。
        </p>
      </div>

      <div className="mt-3 inline-flex rounded-xl border border-neutral-200 bg-white/80 p-1 text-[13px] font-medium leading-5">
        {[
          { value: "file", label: "上传简历文件" },
          { value: "text", label: "粘贴简历文本" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onInputModeChange(item.value as InputMode)}
            className={`cursor-pointer rounded-lg px-3 py-1 transition ${
              inputMode === item.value
                ? "border border-neutral-300 bg-white text-neutral-900 shadow-sm"
                : "border border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {inputMode === "file" ? (
          <div className="mt-3">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf7] px-5 text-center transition hover:border-neutral-500 hover:bg-white">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) =>
                  onFileChange(event.target.files?.[0] ?? null)
                }
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-lg text-white">
                ↑
              </span>
              <span className="mt-2 text-sm font-semibold leading-5 text-neutral-950">
                {file ? file.name : "选择简历文件"}
              </span>
              <span className="mt-1 text-[13px] leading-5 text-neutral-500">
                {file
                  ? formatFileSize(file.size)
                  : "支持 PDF、DOCX，单个文件不超过 10MB"}
              </span>
            </label>
            <p className="mt-2 text-[12px] leading-5 text-neutral-400">
              推荐上传 DOCX，当前版本对 DOCX 的解析效果更稳定。
            </p>
          </div>
        ) : (
          <label className="mt-3 block">
            <span className="text-[13px] font-medium leading-5 text-neutral-600">
              简历文本
            </span>
            <textarea
              value={resumeText}
              onChange={(event) => onResumeTextChange(event.target.value)}
              placeholder="粘贴你的教育背景、实习经历、项目经历、技能和语言能力等简历内容。"
              className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-neutral-300 bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition hover:border-neutral-400 focus:border-neutral-700 focus:bg-white focus:ring-4 focus:ring-neutral-950/10"
            />
          </label>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={isRecognizing}
          onClick={onRecognize}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none"
        >
          {isRecognizing ? "正在识别简历" : "开始识别"}
        </button>
      </div>
    </ContentSection>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

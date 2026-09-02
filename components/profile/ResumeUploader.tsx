import { ContentSection } from "@/components/AppShell";

type ResumeUploaderProps = {
  file: File | null;
  isRecognizing: boolean;
  onFileChange: (file: File | null) => void;
  onRecognize: () => void;
  onResumeTextChange: (value: string) => void;
  resumeText: string;
};

export function ResumeUploader({
  file,
  isRecognizing,
  onFileChange,
  onRecognize,
  onResumeTextChange,
  resumeText,
}: ResumeUploaderProps) {
  return (
    <ContentSection>
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
          Step 1
        </p>
        <h2 className="mt-1.5 text-xl font-semibold text-neutral-950">
          上传简历
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          当前版本支持粘贴简历文本进行 AI 解析。PDF / DOCX
          自动解析将在后续版本支持。
        </p>
      </div>

      <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-[#fbfaf7] px-5 text-center transition hover:border-neutral-500 hover:bg-white">
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-lg text-white">
          ↑
        </span>
        <span className="mt-3 text-base font-semibold text-neutral-950">
          {file ? file.name : "选择简历文件"}
        </span>
        <span className="mt-2 text-base text-neutral-500">
          {file ? formatFileSize(file.size) : "支持 PDF、DOCX，单个文件不超过 10MB"}
        </span>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-neutral-600">简历文本</span>
        <textarea
          value={resumeText}
          onChange={(event) => onResumeTextChange(event.target.value)}
          placeholder="粘贴你的教育背景、实习经历、项目经历、技能和语言能力等简历内容。"
          className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-neutral-300 bg-[#fbfaf7] px-4 py-3 text-base leading-7 text-neutral-900 outline-none transition hover:border-neutral-400 focus:border-neutral-700 focus:bg-white focus:ring-4 focus:ring-neutral-950/10"
        />
      </label>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={isRecognizing}
          onClick={onRecognize}
          className="h-11 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
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

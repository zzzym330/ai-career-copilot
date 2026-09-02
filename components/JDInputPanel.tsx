"use client";

import { useState } from "react";
import { jdExampleGroups } from "@/lib/mock-jd-examples";

type JDInputPanelProps = {
  jd: string;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onChange: (value: string) => void;
  onSelectExample: (jd: string) => void;
};

export function JDInputPanel({
  jd,
  isAnalyzing,
  onAnalyze,
  onChange,
  onSelectExample,
}: JDInputPanelProps) {
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  function handleSelectExample(jd: string) {
    onSelectExample(jd);
    setIsExamplesOpen(false);
  }

  return (
    <section className="flex min-h-[620px] flex-col rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-[0_24px_80px_rgba(23,23,23,0.07)] lg:h-full lg:min-h-0">
      <div className="flex items-start justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            JD Workspace
          </p>
          <h2 className="mt-2 text-xl font-semibold text-neutral-950">
            粘贴岗位描述
          </h2>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExamplesOpen((current) => !current)}
            aria-expanded={isExamplesOpen}
            className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:text-neutral-950"
          >
            试试示例 JD <span className="ml-1 text-neutral-400">▼</span>
          </button>
          {isExamplesOpen ? (
            <ExampleMenu onSelect={handleSelectExample} />
          ) : null}
        </div>
      </div>

      <label htmlFor="jd-input" className="sr-only">
        JD输入区域
      </label>
      <textarea
        id="jd-input"
        value={jd}
        onChange={(event) => onChange(event.target.value)}
        placeholder="将岗位 JD 粘贴到这里，职觉会从职责、技能、岗位门槛和岗位画像中提取关键信号。"
        className="min-h-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-neutral-300 bg-[#fbfaf7] px-5 py-4 text-base leading-7 text-neutral-900 outline-none transition-[border-color,background-color,box-shadow] placeholder:text-neutral-400 hover:border-neutral-400 hover:bg-white focus:border-neutral-700 focus:bg-white focus:ring-4 focus:ring-neutral-950/10"
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        {!jd.trim() ? (
          <button
            type="button"
            onClick={() => setIsExamplesOpen(true)}
            className="text-left text-xs text-neutral-400 transition hover:text-neutral-700"
          >
            没有 JD？试试示例岗位体验职觉。
          </button>
        ) : null}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          aria-busy={isAnalyzing}
          className="ml-auto h-12 rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(23,23,23,0.18)] transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_30px_rgba(23,23,23,0.24)] active:translate-y-0 active:scale-[0.98] active:bg-black disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {isAnalyzing ? "解译中" : "解译岗位"}
        </button>
      </div>
    </section>
  );
}

function ExampleMenu({ onSelect }: { onSelect: (jd: string) => void }) {
  return (
    <div className="absolute right-0 top-12 z-20 max-h-[430px] w-[min(360px,calc(100vw-40px))] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_rgba(23,23,23,0.16)]">
      {jdExampleGroups.map((group) => (
        <div key={group.category} className="p-2">
          <p className="px-2 text-xs font-medium text-neutral-400">
            {group.category}
          </p>
          <div className="mt-1 grid gap-0.5">
            {group.examples.map((example) => (
              <button
                key={example.title}
                type="button"
                onClick={() => onSelect(example.jd)}
                className="rounded-lg px-2 py-2 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

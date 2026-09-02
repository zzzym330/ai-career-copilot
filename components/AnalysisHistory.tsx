import type { AnalysisHistoryEntry } from "@/types/analysis";

type AnalysisHistoryProps = {
  activeHistoryId: string | null;
  history: AnalysisHistoryEntry[];
  onClear: () => void;
  onDelete: (id: string) => void;
  onSelect: (entry: AnalysisHistoryEntry) => void;
};

export function AnalysisHistory({
  activeHistoryId,
  history,
  onClear,
  onDelete,
  onSelect,
}: AnalysisHistoryProps) {
  return (
    <section className="border-t border-neutral-200 pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
            History
          </p>
          <h3 className="mt-2 text-base font-semibold text-neutral-950">
            最近分析
          </h3>
        </div>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-neutral-400 transition hover:text-neutral-950"
          >
            清空历史
          </button>
        ) : null}
      </div>

      {history.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-white/60 px-4 py-5 text-center text-xs text-neutral-400">
          暂无历史分析记录
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
                activeHistoryId === entry.id
                  ? "border-neutral-500 bg-neutral-100"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="min-w-0 flex-1 text-left"
              >
                <p
                  className={`truncate text-base font-medium transition group-hover:text-neutral-950 ${
                    activeHistoryId === entry.id
                      ? "text-neutral-950"
                      : "text-neutral-800"
                  }`}
                >
                  {entry.analysis.jobTitle}
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  {formatAnalyzedAt(entry.analyzedAt)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="shrink-0 text-sm text-neutral-400 transition hover:text-neutral-950"
                aria-label={`删除 ${entry.analysis.jobTitle}`}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatAnalyzedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

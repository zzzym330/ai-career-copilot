type ProfileRequiredModalProps = {
  onClose: () => void;
  onCreateProfile: () => void;
};

export function ProfileRequiredModal({
  onClose,
  onCreateProfile,
}: ProfileRequiredModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/35 px-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-required-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
          Gap Analysis
        </p>
        <h2
          id="profile-required-title"
          className="mt-3 text-xl font-semibold text-neutral-950"
        >
          需要先生成职业画像
        </h2>
        <p className="mt-4 text-sm leading-7 text-neutral-600">
          完成职业画像后，JobPulse 才能分析你与该岗位的具体差距。
        </p>
        <p className="mt-2 text-sm leading-7 text-neutral-500">
          Gap Analysis 需要同时读取 JD
          解译结果和你的职业画像。当前仅完成了 JD
          解译，因此还不能进行个人差距分析。
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={onCreateProfile}
            className="flex-1 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            立即生成职业画像
          </button>
        </div>
      </div>
    </div>
  );
}

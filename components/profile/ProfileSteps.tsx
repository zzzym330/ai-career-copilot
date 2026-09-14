const steps = ["上传简历", "编辑职业信息", "职业画像"];

type ProfileStepsProps = {
  currentStep: number;
  canEditProfile: boolean;
  canViewProfile: boolean;
  onStepChange: (step: number) => void;
};

export function ProfileSteps({
  currentStep,
  canEditProfile,
  canViewProfile,
  onStepChange,
}: ProfileStepsProps) {
  return (
    <ol className="grid grid-cols-3 gap-1.5 lg:grid-cols-1">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;
        const isEnabled =
          stepNumber === 1 ||
          (stepNumber === 2 && canEditProfile) ||
          (stepNumber === 3 && canViewProfile);

        return (
          <li key={step}>
            <button
              type="button"
              disabled={!isEnabled}
              aria-current={isActive ? "step" : undefined}
              onClick={() => onStepChange(stepNumber)}
              className={`w-full rounded-xl border px-2.5 py-1.5 text-left transition ${
                isActive
                  ? "border-neutral-950 bg-white"
                  : isDone
                    ? "border-neutral-300 bg-white/70"
                    : "border-neutral-200 bg-transparent"
              } ${
                isEnabled
                  ? "cursor-pointer hover:border-neutral-400 hover:bg-white hover:text-neutral-950"
                  : "cursor-not-allowed opacity-45"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none ${
                    isActive || isDone
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {isDone ? "✓" : stepNumber}
                </span>
                <span
                  className={`text-[13px] font-medium leading-5 ${
                    isActive ? "text-neutral-950" : "text-neutral-500"
                  }`}
                >
                  {step}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

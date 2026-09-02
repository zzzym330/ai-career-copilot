const steps = ["上传简历", "编辑职业信息", "职业画像"];

type ProfileStepsProps = {
  currentStep: number;
};

export function ProfileSteps({ currentStep }: ProfileStepsProps) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;

        return (
          <li
            key={step}
            className={`border-t-2 pt-2 ${
              isActive || isDone ? "border-neutral-950" : "border-neutral-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isActive || isDone
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {isDone ? "✓" : stepNumber}
              </span>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-neutral-950" : "text-neutral-500"
                }`}
              >
                {step}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

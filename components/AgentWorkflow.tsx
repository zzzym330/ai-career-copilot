const workflowSteps = [
  "解析岗位职责",
  "提取核心技能",
  "构建岗位画像",
  "识别能力缺口",
  "生成岗位洞察",
];

type AgentWorkflowProps = {
  activeStep: number;
};

export function AgentWorkflow({ activeStep }: AgentWorkflowProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-950">Agent Workflow</p>
          <p className="mt-1 text-sm text-neutral-500">正在解译岗位信号</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-950 shadow-[0_0_0_6px_rgba(23,23,23,0.08)]" />
      </div>

      <ol className="mt-5 space-y-3">
        {workflowSteps.map((step, index) => {
          const isDone = index <= activeStep;
          const isActive = index === activeStep;

          return (
            <li
              key={step}
              className="flex items-center gap-3 text-sm text-neutral-600"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                  isDone
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-300"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span className={isDone ? "text-neutral-950" : ""}>{step}</span>
              {isActive ? (
                <span className="ml-auto text-xs text-neutral-400">处理中</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

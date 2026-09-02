const dimensions = [
  { label: "学习进化力", score: 86 },
  { label: "逻辑策行力", score: 78 },
  { label: "沟通协作力", score: 88 },
  { label: "自驱成长力", score: 84 },
  { label: "行业积累力", score: 72 },
  { label: "表达呈现力", score: 90 },
];

const center = 260;
const radius = 145;
const labelRadius = 210;

export function ProfileRadar() {
  const axes = dimensions.map((_, index) =>
    pointFor(index, dimensions.length, radius),
  );
  const scorePoints = dimensions.map((item, index) =>
    pointFor(index, dimensions.length, radius * (item.score / 100)),
  );

  return (
    <div className="grid items-center gap-6 xl:grid-cols-[minmax(420px,1.15fr)_minmax(300px,0.85fr)]">
      <svg
        viewBox="0 0 520 520"
        role="img"
        aria-label="JobPulse Career DNA 雷达图"
        className="mx-auto aspect-square w-full max-w-[520px]"
      >
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={dimensions
              .map((_, index) =>
                serializePoint(
                  pointFor(index, dimensions.length, radius * scale),
                ),
              )
              .join(" ")}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="1.25"
          />
        ))}

        {axes.map((point, index) => (
          <line
            key={dimensions[index].label}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#e5e5e5"
            strokeWidth="1.25"
          />
        ))}

        <polygon
          points={scorePoints.map(serializePoint).join(" ")}
          fill="rgba(23,23,23,0.13)"
          stroke="#171717"
          strokeWidth="2.5"
        />

        {scorePoints.map((point, index) => (
          <circle
            key={dimensions[index].label}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#171717"
          />
        ))}

        {dimensions.map((item, index) => {
          const point = pointFor(index, dimensions.length, labelRadius);
          const textAnchor =
            point.x < center - 20
              ? "end"
              : point.x > center + 20
                ? "start"
                : "middle";

          return (
            <text
              key={item.label}
              x={point.x}
              y={point.y - 7}
              textAnchor={textAnchor}
              fill="#404040"
              fontSize="15"
              fontWeight="600"
            >
              <tspan x={point.x}>{item.label}</tspan>
              <tspan
                x={point.x}
                dy="22"
                fill="#171717"
                fontSize="18"
                fontWeight="700"
              >
                {item.score}
              </tspan>
            </text>
          );
        })}
      </svg>

      <aside className="border-t border-neutral-200 pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
          能力概览评价
        </p>
        <div className="mt-4 space-y-4 text-sm leading-6 text-neutral-600">
          <p>
            你具备较强的学习进化力、沟通协作力和表达呈现力，能够快速吸收新知识、适应变化，并在跨团队环境中清晰传递信息、推动共识与合作。
          </p>
          <p>
            逻辑策行力与自驱成长力已形成良好基础，说明你能够主动探索问题，并将分析思路逐步转化为行动。行业积累力仍有进一步提升空间，可通过更深入的项目实践持续强化。
          </p>
          <p>
            整体来看，你已经具备较成熟的职业发展潜力，适合承担需要沟通协调、信息分析、快速学习与持续推进的岗位职责。
          </p>
        </div>
        <p className="mt-5 border-t border-neutral-200 pt-4 text-sm leading-6 text-neutral-400">
          JobPulse Career DNA 使用固定六维模型。后续更新简历时，维度保持不变，仅分数动态变化。
        </p>
      </aside>
    </div>
  );
}

function pointFor(index: number, total: number, scaledRadius: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  return {
    x: center + Math.cos(angle) * scaledRadius,
    y: center + Math.sin(angle) * scaledRadius,
  };
}

function serializePoint(point: { x: number; y: number }) {
  return `${point.x},${point.y}`;
}

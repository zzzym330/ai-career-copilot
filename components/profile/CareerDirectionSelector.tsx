"use client";

import { useMemo, useState } from "react";
import type { CareerDirection } from "@/types/profile";

const directionOptions: Record<string, string[]> = {
  产品: [
    "产品经理",
    "增长产品经理",
    "商业化产品经理",
    "平台产品经理",
    "策略产品经理",
    "用户产品经理",
    "其他产品岗位",
  ],
  运营: [
    "内容运营",
    "用户运营",
    "活动运营",
    "社区运营",
    "增长运营",
    "电商运营",
    "商家运营",
    "直播运营",
    "产品运营",
    "其他运营岗位",
  ],
  数据: [
    "数据分析师",
    "商业分析师",
    "BI分析师",
    "数据运营",
    "数据产品相关岗位",
    "其他数据岗位",
  ],
  技术: [
    "前端开发",
    "后端开发",
    "全栈开发",
    "算法工程师",
    "测试工程师",
    "数据工程师",
    "运维工程师",
    "其他技术岗位",
  ],
  AI: [
    "Prompt Engineer",
    "AI应用开发",
    "AI训练师",
    "AI解决方案顾问",
    "LLM运营",
    "AI相关岗位",
    "其他AI岗位",
  ],
  咨询: [
    "管理咨询",
    "战略咨询",
    "IT咨询",
    "SAP咨询",
    "商业分析",
    "项目咨询",
    "其他咨询岗位",
  ],
  市场营销: ["品牌营销", "市场策划", "数字营销", "公关传播", "其他营销岗位"],
  销售与商务: ["商务拓展", "客户成功", "解决方案销售", "渠道销售", "其他商务岗位"],
  设计: ["产品设计", "视觉设计", "交互设计", "用户体验设计", "其他设计岗位"],
  人力资源: ["招聘", "组织发展", "员工关系", "人力资源运营", "其他人力岗位"],
  财务金融: ["财务分析", "投资分析", "风险管理", "审计", "其他财务金融岗位"],
  项目管理: ["项目经理", "项目运营", "交付管理", "PMO", "其他项目管理岗位"],
  教育培训: ["课程研发", "教学运营", "教育产品", "培训师", "其他教育培训岗位"],
  传媒内容: ["内容策划", "编辑", "新媒体运营", "视频制作", "其他传媒内容岗位"],
  其他: ["其他岗位"],
};

type CareerDirectionSelectorProps = {
  value: CareerDirection[];
  onChange: (value: CareerDirection[]) => void;
};

export function CareerDirectionSelector({
  value,
  onChange,
}: CareerDirectionSelectorProps) {
  const categories = useMemo(() => Object.keys(directionOptions), []);
  const [category, setCategory] = useState(categories[0]);
  const [role, setRole] = useState(directionOptions[categories[0]][0]);
  const [exploreWholeDirection, setExploreWholeDirection] = useState(true);
  const isAtLimit = value.length >= 3;

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setRole(directionOptions[nextCategory][0]);
  }

  function addDirection() {
    const nextDirection = {
      id: crypto.randomUUID(),
      category,
      ...(exploreWholeDirection ? {} : { role }),
    };
    const isDuplicate = value.some(
      (item) =>
        item.category === nextDirection.category &&
        item.role === nextDirection.role,
    );

    if (!isAtLimit && !isDuplicate) {
      onChange([...value, nextDirection]);
    }
  }

  return (
    <section className="border-b border-neutral-200 py-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">
            目标发展方向
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            可探索整个方向，或选择具体岗位。最多加入 3 个方向。
          </p>
        </div>
        <span className="text-sm text-neutral-400">{value.length} / 3</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.map((item) => (
          <div
            key={item.id}
            className="flex items-center rounded-full border border-neutral-300 bg-neutral-50 pl-3 text-sm font-medium text-neutral-700"
          >
            <span>{formatDirection(item)}</span>
            <button
              type="button"
              aria-label={`删除发展方向 ${formatDirection(item)}`}
              onClick={() =>
                onChange(value.filter((direction) => direction.id !== item.id))
              }
              className="px-3 py-2 text-neutral-400 transition hover:text-neutral-950"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
        <SelectField
          label="一级方向"
          value={category}
          options={categories}
          onChange={selectCategory}
        />
        <SelectField
          label="二级岗位（可选）"
          value={role}
          options={directionOptions[category]}
          onChange={setRole}
          disabled={exploreWholeDirection}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 sm:col-span-2">
          <input
            type="checkbox"
            checked={exploreWholeDirection}
            onChange={(event) => setExploreWholeDirection(event.target.checked)}
            className="h-4 w-4 accent-neutral-950"
          />
          探索整个方向
        </label>
        <button
          type="button"
          disabled={isAtLimit}
          onClick={addDirection}
          className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:col-span-2 sm:justify-self-start"
        >
          加入我的发展方向
        </button>
      </div>
    </section>
  );
}

export function formatDirection(direction: CareerDirection) {
  return direction.role ?? `${direction.category}方向`;
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-950/5 disabled:bg-neutral-100 disabled:text-neutral-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

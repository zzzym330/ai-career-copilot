type SkillTagsProps = {
  items: string[];
  tone?: "default" | "warning";
};

export function SkillTags({ items, tone = "default" }: SkillTagsProps) {
  const className =
    tone === "warning"
      ? "border-stone-300 bg-stone-100 text-stone-800"
      : "border-neutral-200 bg-neutral-50 text-neutral-700";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${className}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

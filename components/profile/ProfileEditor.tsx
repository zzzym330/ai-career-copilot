"use client";

import { useState } from "react";
import { ContentSection } from "@/components/AppShell";
import { CareerDirectionSelector } from "@/components/profile/CareerDirectionSelector";
import type {
  CareerProfile,
  EducationExperience,
  InternshipExperience,
  ProjectExperience,
} from "@/types/profile";

type ProfileEditorProps = {
  profile: CareerProfile;
  isGenerating: boolean;
  onChange: (profile: CareerProfile) => void;
  onGenerate: () => void;
  onReset: () => void;
};

export function ProfileEditor({
  isGenerating,
  profile,
  onChange,
  onGenerate,
  onReset,
}: ProfileEditorProps) {
  return (
    <div className="space-y-4">
      <ContentSection compact>
        <div className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[11px] font-medium uppercase leading-4 tracking-[0.16em] text-neutral-400">
              Step 2
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-6 text-neutral-950">
              编辑职业信息
            </h2>
            <p className="mt-1.5 max-w-3xl text-[14px] leading-6 text-neutral-500">
              AI 已根据你的简历生成初版职业信息。请检查、修改或补充内容，确认后的信息将用于生成职业画像，并支持后续差距分析、面试准备和简历优化。
            </p>
            <p className="mt-1 text-[13px] leading-5 text-neutral-400">
              AI 已根据简历自动整理，请检查关键信息是否完整并按需修改。
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="h-8 shrink-0 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-sm"
          >
            重新上传
          </button>
        </div>

        <CareerDirectionSelector
          value={profile.targetDirections}
          onChange={(targetDirections) =>
            onChange({ ...profile, targetDirections })
          }
        />

        <EntrySection title="教育背景" onAdd={() => addEducation(profile, onChange)}>
          {profile.education.map((item) => (
            <EducationItem
              key={item.id}
              item={item}
              onSave={(updated) =>
                onChange({
                  ...profile,
                  education: replaceById(profile.education, updated),
                })
              }
              onDelete={() =>
                onChange({
                  ...profile,
                  education: removeById(profile.education, item.id),
                })
              }
            />
          ))}
        </EntrySection>

        <EntrySection
          title="实习经历"
          onAdd={() => addInternship(profile, onChange)}
        >
          {profile.internships.map((item) => (
            <ExperienceItem
              key={item.id}
              title={item.company}
              subtitle={item.role}
              description={item.description}
              onSave={(values) =>
                onChange({
                  ...profile,
                  internships: replaceById(profile.internships, {
                    id: item.id,
                    company: values.title,
                    role: values.subtitle,
                    description: values.description,
                  }),
                })
              }
              onDelete={() =>
                onChange({
                  ...profile,
                  internships: removeById(profile.internships, item.id),
                })
              }
            />
          ))}
        </EntrySection>

        <EntrySection
          title="项目经历"
          onAdd={() => addProject(profile, onChange)}
        >
          {profile.projects.map((item) => (
            <ExperienceItem
              key={item.id}
              title={item.name}
              subtitle={item.role}
              description={item.description}
              onSave={(values) =>
                onChange({
                  ...profile,
                  projects: replaceById(profile.projects, {
                    id: item.id,
                    name: values.title,
                    role: values.subtitle,
                    description: values.description,
                  }),
                })
              }
              onDelete={() =>
                onChange({
                  ...profile,
                  projects: removeById(profile.projects, item.id),
                })
              }
            />
          ))}
        </EntrySection>

        <SimpleListEditor
          title="技能"
          items={profile.skills}
          onChange={(skills) => onChange({ ...profile, skills })}
        />
        <SimpleListEditor
          title="语言能力"
          items={profile.languages}
          onChange={(languages) => onChange({ ...profile, languages })}
          isLast
        />
      </ContentSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={profile.targetDirections.length === 0 || isGenerating}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none"
        >
          {isGenerating ? "正在生成职业画像" : "保存并生成职业画像"}
        </button>
      </div>
    </div>
  );
}

function EntrySection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-neutral-200 py-3.5">
      <h3 className="text-base font-semibold leading-6 text-neutral-950">
        {title}
      </h3>
      <div className="mt-3 divide-y divide-neutral-200">{children}</div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium leading-4 text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
      >
        + 新增
      </button>
    </section>
  );
}

function EducationItem({
  item,
  onSave,
  onDelete,
}: {
  item: EducationExperience;
  onSave: (item: EducationExperience) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(item.school === "");
  const [draft, setDraft] = useState(item);

  if (isEditing) {
    return (
      <EditForm
        fields={[
          { label: "学校", value: draft.school, key: "school" },
          { label: "学历", value: draft.degree, key: "degree" },
          { label: "研究方向 / 专业", value: draft.focus, key: "focus" },
        ]}
        onChange={(key, value) => setDraft({ ...draft, [key]: value })}
        onCancel={() => {
          setDraft(item);
          setIsEditing(false);
        }}
        onSave={() => {
          onSave(draft);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <DisplayItem
      title={item.school}
      subtitle={item.degree}
      description={item.focus}
      onEdit={() => setIsEditing(true)}
      onDelete={onDelete}
    />
  );
}

function ExperienceItem({
  title,
  subtitle,
  description,
  onSave,
  onDelete,
}: {
  title: string;
  subtitle: string;
  description: string;
  onSave: (values: {
    title: string;
    subtitle: string;
    description: string;
  }) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(title === "");
  const [draft, setDraft] = useState({ title, subtitle, description });

  if (isEditing) {
    return (
      <EditForm
        fields={[
          { label: "名称", value: draft.title, key: "title" },
          { label: "岗位 / 项目类型", value: draft.subtitle, key: "subtitle" },
          {
            label: "经历描述",
            value: draft.description,
            key: "description",
            multiline: true,
          },
        ]}
        onChange={(key, value) => setDraft({ ...draft, [key]: value })}
        onCancel={() => {
          setDraft({ title, subtitle, description });
          setIsEditing(false);
        }}
        onSave={() => {
          onSave(draft);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <DisplayItem
      title={title}
      subtitle={subtitle}
      description={description}
      onEdit={() => setIsEditing(true)}
      onDelete={onDelete}
    />
  );
}

function DisplayItem({
  title,
  subtitle,
  description,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-2.5 py-3 first:pt-0 sm:flex-row">
      <div>
        <p className="text-[15px] font-semibold leading-6 text-neutral-950">
          {title || "未命名条目"}
        </p>
        <p className="mt-0.5 text-[14px] font-medium leading-5 text-neutral-500">
          {subtitle}
        </p>
        <p className="mt-1.5 text-[15px] leading-6 text-neutral-500">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 gap-3 text-[13px] font-medium leading-5">
        <button
          type="button"
          onClick={onEdit}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
        >
          编辑
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
        >
          删除
        </button>
      </div>
    </div>
  );
}

type EditField = {
  label: string;
  value: string;
  key: string;
  multiline?: boolean;
};

function EditForm({
  fields,
  onChange,
  onSave,
  onCancel,
}: {
  fields: EditField[];
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="grid gap-2.5 py-3 first:pt-0 sm:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.key}
          className={field.multiline ? "sm:col-span-2" : ""}
        >
          <span className="text-xs font-medium text-neutral-400">
            {field.label}
          </span>
          {field.multiline ? (
            <textarea
              value={field.value}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] leading-6 outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-950/5"
            />
          ) : (
            <input
              value={field.value}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="mt-1.5 h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-[15px] outline-none focus:border-neutral-400 focus:bg-white focus:ring-4 focus:ring-neutral-950/5"
            />
          )}
        </label>
      ))}
      <div className="flex gap-2.5 sm:col-span-2">
        <button
          type="button"
          onClick={onSave}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-sm"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950 hover:shadow-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}

function SimpleListEditor({
  title,
  items,
  onChange,
  isLast = false,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  isLast?: boolean;
}) {
  return (
    <section className={`py-3.5 ${isLast ? "" : "border-b border-neutral-200"}`}>
      <h3 className="text-base font-semibold leading-6 text-neutral-950">
        {title}
      </h3>
      <div className="mt-3 space-y-1.5">
        {items.map((item, index) => (
          <SimpleListItem
            key={`${index}-${item}`}
            item={item}
            onSave={(value) =>
              onChange(
                items.map((existing, itemIndex) =>
                  itemIndex === index ? value : existing,
                ),
              )
            }
            onDelete={() =>
              onChange(items.filter((_, itemIndex) => itemIndex !== index))
            }
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-3 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium leading-4 text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
      >
        + 新增
      </button>
    </section>
  );
}

function SimpleListItem({
  item,
  onSave,
  onDelete,
}: {
  item: string;
  onSave: (item: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(item === "");
  const [draft, setDraft] = useState(item);

  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3">
      {isEditing ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none"
        />
      ) : (
        <span className="text-[15px] font-medium leading-6 text-neutral-700">
          {item}
        </span>
      )}
      <div className="flex shrink-0 gap-3 text-[13px] font-medium">
        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              onSave(draft);
            }
            setIsEditing(!isEditing);
          }}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
        >
          {isEditing ? "保存" : "编辑"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950"
        >
          删除
        </button>
      </div>
    </div>
  );
}

function addEducation(
  profile: CareerProfile,
  onChange: (profile: CareerProfile) => void,
) {
  onChange({
    ...profile,
    education: [
      ...profile.education,
      { id: crypto.randomUUID(), school: "", degree: "", focus: "" },
    ],
  });
}

function addInternship(
  profile: CareerProfile,
  onChange: (profile: CareerProfile) => void,
) {
  const item: InternshipExperience = {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    description: "",
  };
  onChange({ ...profile, internships: [...profile.internships, item] });
}

function addProject(
  profile: CareerProfile,
  onChange: (profile: CareerProfile) => void,
) {
  const item: ProjectExperience = {
    id: crypto.randomUUID(),
    name: "",
    role: "",
    description: "",
  };
  onChange({ ...profile, projects: [...profile.projects, item] });
}

function replaceById<T extends { id: string }>(items: T[], updated: T) {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

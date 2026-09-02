"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "岗位洞察" },
  { href: "/gap-analysis", label: "岗位差距分析" },
  { href: "/interview-generator", label: "个性化面试题" },
];

export function JourneyNav() {
  const pathname = usePathname();

  return (
    <div className="page-container flex pb-3">
      <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white/70 p-1 text-xs font-medium shadow-sm">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 transition ${
                isActive
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

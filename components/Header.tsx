"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isProfileActive = pathname.startsWith("/profile");

  return (
    <header className="page-container flex h-[108px] items-center justify-between">
      <Link href="/" className="flex items-center gap-3.5">
        <Image
          src="/jobpulse-logo.svg"
          alt="JobPulse logo"
          width={90}
          height={90}
          className="h-[74px] w-[74px] shrink-0 object-contain sm:h-[90px] sm:w-[90px]"
        />
        <div>
          <div className="text-sm font-semibold tracking-normal text-neutral-950 sm:text-[17px]">
            职觉 JobPulse
          </div>
          <div className="mt-0.5 hidden text-xs font-medium text-neutral-500 sm:block">
            解译职业脉动
          </div>
        </div>
      </Link>
      <nav className="flex items-center gap-0.5 rounded-xl border border-neutral-200 bg-white/80 p-1 text-[11px] font-medium shadow-sm sm:gap-1 sm:text-sm">
        <Link
          href="/"
          className={`rounded-lg px-2 py-1.5 transition sm:px-3.5 ${
            !isProfileActive
              ? "bg-neutral-950 text-white shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          }`}
        >
          JD解译
        </Link>
        <Link
          href="/profile"
          className={`rounded-lg px-2 py-1.5 transition sm:px-3.5 ${
            isProfileActive
              ? "bg-neutral-950 text-white shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          }`}
        >
          我的画像
        </Link>
      </nav>
    </header>
  );
}

import { Header } from "@/components/Header";
import { JourneyNav } from "@/components/JourneyNav";
import { PageScrollReset } from "@/components/PageScrollReset";

type AppShellProps = {
  children: React.ReactNode;
  showJourneyNav?: boolean;
  viewportLocked?: boolean;
  reserveJourneyNavSpace?: boolean;
};

export function AppShell({
  children,
  showJourneyNav = false,
  viewportLocked = false,
  reserveJourneyNavSpace = true,
}: AppShellProps) {
  return (
    <main
      className={`min-h-screen bg-[#f5f5f3] text-neutral-950 ${
        viewportLocked ? "lg:h-screen lg:overflow-hidden" : ""
      }`}
    >
      <Header />
      {showJourneyNav ? (
        <JourneyNav />
      ) : reserveJourneyNavSpace ? (
        <div className="page-container h-[43px]" aria-hidden="true" />
      ) : (
        <div className="h-2" aria-hidden="true" />
      )}
      <PageScrollReset />
      {children}
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="page-container pb-2 pt-0">
        <p className="text-[11px] font-medium leading-4 text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-8 text-neutral-950">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-neutral-500">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className="page-container readable-content pb-4 pt-1">
      <p className="text-sm font-medium text-neutral-500">{eyebrow}</p>
      <h1 className="mt-1.5 text-3xl font-semibold text-neutral-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

export function ContentSection({
  children,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white shadow-[0_16px_48px_rgba(23,23,23,0.04)] ${
        compact ? "p-4" : "p-5"
      } ${className}`}
    >
      {children}
    </section>
  );
}

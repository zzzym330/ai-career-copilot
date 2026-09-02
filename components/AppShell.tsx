import { Header } from "@/components/Header";
import { JourneyNav } from "@/components/JourneyNav";
import { PageScrollReset } from "@/components/PageScrollReset";

type AppShellProps = {
  children: React.ReactNode;
  showJourneyNav?: boolean;
  viewportLocked?: boolean;
};

export function AppShell({
  children,
  showJourneyNav = false,
  viewportLocked = false,
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
      ) : (
        <div className="page-container h-[43px]" aria-hidden="true" />
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
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_16px_48px_rgba(23,23,23,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

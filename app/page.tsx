import { AppShell } from "@/components/AppShell";
import { CareerWorkspace } from "@/components/CareerWorkspace";

export default function Home() {
  return (
    <AppShell showJourneyNav viewportLocked>
      <CareerWorkspace />
    </AppShell>
  );
}

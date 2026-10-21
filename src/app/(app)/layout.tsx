import { AppShell } from "@/components/app-shell";
import { requireProfile, requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await requireProfile(user);
  return (
    <AppShell user={user} profile={profile}>
      {children}
    </AppShell>
  );
}

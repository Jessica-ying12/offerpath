import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { requireProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "设定目标" };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const profile = await requireProfile(user);
  if (profile.onboarded) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Brand />
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted/60">SETUP · {user.name}</span>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-8 sm:pt-12">
        <OnboardingWizard initialTrack={profile.trackId} initialLevel={profile.level} />
      </main>
    </div>
  );
}

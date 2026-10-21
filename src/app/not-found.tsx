import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonClass } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      <header className="relative z-10 px-5 py-6 sm:px-8">
        <Brand />
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-20 text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-lime/70">404 · OFF THE PATH</p>
        <h1 className="mt-5 text-[42px] font-semibold tracking-[-0.04em] text-paper">这一步走岔了。</h1>
        <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
          页面不存在或已经变化。回到训练台，继续今天能完成的一小步。
        </p>
        <Link href="/dashboard" className={buttonClass("primary", "lg", "mt-8")}>
          <ArrowLeft className="h-4 w-4" />
          回到训练台
        </Link>
      </main>
    </div>
  );
}

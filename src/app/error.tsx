"use client";

import { Button } from "@/components/ui/primitives";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-[11px] tracking-[0.18em] text-coral">UNEXPECTED ERROR</p>
      <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-paper">
        这一页暂时没能加载。
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        已保留你的账号与学习记录。可以重试；若持续出现，请回到总览后再进入。
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10px] text-muted/40">trace · {error.digest}</p>
      ) : null}
      <Button className="mt-7" onClick={reset}>
        重新加载
      </Button>
    </div>
  );
}

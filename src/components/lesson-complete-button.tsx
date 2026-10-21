"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function LessonCompleteButton({
  atomId,
  nextHref,
  completed,
}: {
  atomId: string;
  nextHref: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (completed) {
      router.push(nextHref);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/learning/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ atomId }),
      });
      const data = (await response.json()) as { error?: string; nextHref?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败，请重试");
        return;
      }
      router.push(data.nextHref ?? nextHref);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="lg" onClick={handleClick} disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : completed ? (
          <Check className="h-4 w-4" />
        ) : null}
        {loading ? "正在记录…" : completed ? "已完成，进入下一节" : "完成本节，继续"}
        {!loading && !completed ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

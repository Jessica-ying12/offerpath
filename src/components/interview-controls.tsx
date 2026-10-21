"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Square } from "lucide-react";
import { Button, Textarea } from "@/components/ui/primitives";
import { MAX_ANSWER_LENGTH, MIN_ANSWER_LENGTH } from "@/lib/constants";

export function InterviewAnswerForm({
  sessionId,
  questionId,
  attempt,
  hint,
}: {
  sessionId: string;
  questionId: string;
  attempt: "first" | "retry" | "followup";
  hint?: string | null;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = answer.trim().length >= MIN_ANSWER_LENGTH;

  async function submit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/interviews/${sessionId}/turn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, answer }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "提交失败，请稍后重试");
        return;
      }
      setAnswer("");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card border border-lime/20 bg-lime/[0.025] p-4 sm:p-5">
      {attempt === "retry" && hint ? (
        <div className="mb-4 rounded-lg border border-amber/20 bg-amber/[0.045] px-3.5 py-3 text-[12px] leading-6 text-amber/90">
          <span className="font-medium">面试官提示：</span>
          {hint}
        </div>
      ) : null}
      <Textarea
        label={attempt === "retry" ? "再答一次" : attempt === "followup" ? "回答追问" : "你的回答"}
        name="answer"
        placeholder="先说结论，再讲机制和取舍，最后用项目里的证据收尾。可以用「因为 / 所以 / 代价是」。"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={5}
        maxLength={MAX_ANSWER_LENGTH}
        hint={`${answer.length}/${MAX_ANSWER_LENGTH}`}
      />
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-coral">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-muted/50">
          至少 {MIN_ANSWER_LENGTH} 字 · 按要点覆盖与表达完整度评分
        </p>
        <Button onClick={submit} disabled={!canSubmit || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "面试官正在评估…" : attempt === "retry" ? "提交第二次回答" : "提交回答"}
        </Button>
      </div>
    </div>
  );
}

export function EndInterviewButton({ sessionId, hasTurns }: { sessionId: string; hasTurns: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function end() {
    if (!hasTurns) {
      setError("至少回答一道题后才能结束");
      return;
    }
    if (!window.confirm("结束后将生成本次面试报告，不能继续作答。确定结束吗？")) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/interviews/${sessionId}/end`, { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "结束失败，请稍后重试");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={end} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
        结束并生成报告
      </Button>
      {error ? <p className="text-[10px] text-coral">{error}</p> : null}
    </div>
  );
}

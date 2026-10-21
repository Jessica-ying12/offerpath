"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge, Button, buttonClass, Progress } from "@/components/ui/primitives";
import type { QuizResult } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  skills: string[];
  level: string;
};

const LETTERS = ["A", "B", "C", "D"];

export function QuizRunner({
  questions,
  sourceType,
  sourceId,
  contextLabel,
  challenge = null,
  backHref,
  priorAttempt,
}: {
  questions: QuizQuestion[];
  sourceType: "chapter" | "mistake";
  sourceId: string;
  contextLabel: string;
  challenge?: { id: string; title: string; language: string } | null;
  backHref: string;
  priorAttempt?: { score: number; total: number } | null;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [resolvedMistakes, setResolvedMistakes] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startTime = useRef(Date.now());

  const question = questions[index];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = index === total - 1;

  const detailById = useMemo(() => {
    const map = new Map<string, QuizResult["details"][number]>();
    result?.details.forEach((detail) => map.set(detail.questionId, detail));
    return map;
  }, [result]);

  function choose(optionIndex: number) {
    setCurrent(optionIndex);
  }

  function saveAndNext() {
    if (current === null) return;
    setAnswers((previous) => ({ ...previous, [question.id]: current }));
    setCurrent(null);
    if (!isLast) {
      setIndex((value) => value + 1);
    }
  }

  function goPrevious() {
    if (index === 0) return;
    const previousQuestion = questions[index - 1];
    setIndex((value) => value - 1);
    setCurrent(answers[previousQuestion.id] ?? null);
  }

  async function submit() {
    if (current === null) return;
    const finalAnswers = { ...answers, [question.id]: current };
    if (Object.keys(finalAnswers).length !== total) {
      setError("还有题目未作答，请返回补全");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const durationSeconds = Math.min(
        7200,
        Math.max(1, Math.round((Date.now() - startTime.current) / 1000)),
      );
      const response = await fetch("/api/practice/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          durationSeconds,
          answers: Object.entries(finalAnswers).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
          })),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        result?: QuizResult & { resolvedMistakes: number };
      };
      if (!response.ok || !data.result) {
        setError(data.error ?? "提交失败，请稍后重试");
        return;
      }
      setResult(data.result);
      setResolvedMistakes(data.result.resolvedMistakes);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setAnswers({});
    setCurrent(null);
    setIndex(0);
    setResult(null);
    setResolvedMistakes(0);
    setError("");
    startTime.current = Date.now();
  }

  if (result) {
    const scorePercent = percent(result.score, result.total);
    const wrong = result.details.filter((detail) => !detail.correct);
    return (
      <div className="space-y-4">
        <div className="rounded-card border border-white/[0.08] bg-ink-800/70 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="eyebrow mb-2 text-lime/80">RESULT / {contextLabel}</div>
              <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-paper">
                {scorePercent >= 80 ? "这一章拿下了。" : scorePercent >= 60 ? "及格，但还有缝隙。" : "先补缺口，再回来。"}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">
                答对 {result.score}/{result.total} 题 · 正确率 {scorePercent}%
                {resolvedMistakes > 0 ? ` · 解决 ${resolvedMistakes} 道历史错题` : ""}
              </p>
              {wrong.length > 0 ? (
                <p className="mt-1 text-[11px] text-amber/80">
                  {wrong.length} 道题已进入错题队列，稍后重做，答对即清除。
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-mint/80">全部答对，继续保持。</p>
              )}
            </div>
            <div className="flex h-[92px] w-[92px] shrink-0 flex-col items-center justify-center rounded-full border-4 border-lime/20 bg-lime/[0.04]">
              <span className="font-mono text-2xl text-lime">{scorePercent}</span>
              <span className="text-[9px] text-muted">SCORE</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-white/[0.06] pt-5">
            <Button onClick={restart} variant="secondary">
              <RotateCcw className="h-4 w-4" />
              再练一次
            </Button>
            {wrong.length > 0 ? (
              <Link href="/practice/review" className={buttonClass("secondary", "md")}>
                去错题复习
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            {challenge ? (
              <Link href={`/practice/code/${challenge.id}`} className={buttonClass("primary", "md")}>
                <Code2 className="h-4 w-4" />
                去写代码题
              </Link>
            ) : (
              <Link href={backHref} className={buttonClass("primary", "md")}>
                返回学习
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {result.details.map((detail, detailIndex) => {
            const wrongAnswer = detail.correctIndex;
            return (
              <div
                key={detail.questionId}
                className={cn(
                  "rounded-xl border p-4 sm:p-5",
                  detail.correct
                    ? "border-mint/15 bg-mint/[0.025]"
                    : "border-coral/20 bg-coral/[0.025]",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      detail.correct ? "bg-mint/12 text-mint" : "bg-coral/12 text-coral",
                    )}
                  >
                    {detail.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted/50">
                        Q{String(detailIndex + 1).padStart(2, "0")}
                      </span>
                      <Badge tone={detail.correct ? "mint" : "coral"}>
                        {detail.correct ? "正确" : "答错"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[13px] font-medium leading-6 text-paper/90">
                      {detail.prompt}
                    </p>
                    <div className="mt-3 grid gap-1.5 text-[12px] leading-5">
                      <p className={detail.correct ? "text-mint/80" : "text-coral/90"}>
                        你的选择：{LETTERS[detail.selectedIndex]}. {questions.find((q) => q.id === detail.questionId)?.options[detail.selectedIndex]}
                      </p>
                      {!detail.correct ? (
                        <p className="text-mint/80">
                          正确答案：{LETTERS[wrongAnswer]}. {questions.find((q) => q.id === detail.questionId)?.options[wrongAnswer]}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-3 rounded-lg border border-white/[0.06] bg-ink-950/40 px-3 py-2.5 text-[12px] leading-6 text-muted">
                      {detail.explanation}
                    </p>
                    {detail.skills.length > 0 ? (
                      <p className="mt-2 font-mono text-[9px] text-muted/40">
                        {detail.skills.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-white/[0.08] bg-ink-800/65">
      <div className="border-b border-white/[0.06] px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Badge tone="outline">{contextLabel}</Badge>
            <span className="font-mono text-[10px] text-muted/50">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {priorAttempt ? (
              <span className="text-[10px] text-muted/50">
                上次 {priorAttempt.score}/{priorAttempt.total}
              </span>
            ) : null}
            <span className="font-mono text-[10px] text-muted/50">{answeredCount} 已答</span>
          </div>
        </div>
        <Progress value={answeredCount} total={total} className="mt-3.5" />
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-lime/70">QUESTION {String(index + 1).padStart(2, "0")}</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <h2 id={`question-${question.id}`} className="mt-4 text-[18px] font-semibold leading-8 tracking-[-0.01em] text-paper sm:text-[20px]">
          {question.prompt}
        </h2>

        <div
          role="radiogroup"
          aria-labelledby={`question-${question.id}`}
          className="mt-6 space-y-2.5"
        >
          {question.options.map((option, optionIndex) => {
            const selected = current === optionIndex;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(optionIndex)}
                className={cn(
                  "flex w-full items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition duration-150",
                  selected
                    ? "border-lime/45 bg-lime/[0.055]"
                    : "border-white/[0.07] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                    selected
                      ? "border-lime bg-lime text-ink-950"
                      : "border-white/[0.12] text-muted",
                  )}
                >
                  {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : LETTERS[optionIndex]}
                </span>
                <span className={cn("text-[13px] leading-6", selected ? "text-paper" : "text-paper/75")}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-coral/25 bg-coral/[0.07] px-3.5 py-2.5 text-[12px] text-coral">
            {error}
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={goPrevious} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" />
            上一题
          </Button>
          {isLast ? (
            <Button
              onClick={submit}
              disabled={current === null || answeredCount < total - 1 || submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting
                ? "正在判分…"
                : `提交整套练习（${Math.min(total, answeredCount + (current !== null ? 1 : 0))}/${total}）`}
              {!submitting ? <CheckCircle2 className="h-4 w-4" /> : null}
            </Button>
          ) : (
            <Button onClick={saveAndNext} disabled={current === null}>
              保存，下一题
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

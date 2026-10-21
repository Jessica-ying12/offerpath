"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Loader2,
  Play,
  Save,
  Terminal,
  X,
} from "lucide-react";
import { Badge, Button, buttonClass, Progress } from "@/components/ui/primitives";
import { runJavaScriptTests, type SandboxTestResult } from "@/lib/client/code-sandbox";
import { cn } from "@/lib/utils";

export type ChallengeViewData = {
  id: string;
  title: string;
  prompt: string;
  language: "javascript" | "kotlin";
  functionName: string | null;
  requirements: string[];
  starterCode: string;
  tests: Array<{ name: string; args: unknown[]; expected: unknown }>;
  rubric: string[];
  level: string;
};

export function CodeChallengeView({
  challenge,
  latestAttempt,
  hasAttempt,
  backHref,
  practiceHref,
  trackName,
}: {
  challenge: ChallengeViewData;
  latestAttempt: { passed: number; total: number; createdAt: string } | null;
  hasAttempt: boolean;
  backHref: string;
  practiceHref: string;
  trackName: string;
}) {
  const isJavaScript = challenge.language === "javascript";
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<SandboxTestResult[]>([]);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempted, setAttempted] = useState(hasAttempt);
  const [solution, setSolution] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState("");
  const [completed, setCompleted] = useState(
    Boolean(latestAttempt && latestAttempt.total > 0 && latestAttempt.passed === latestAttempt.total),
  );

  const totalTests = isJavaScript ? challenge.tests.length : 1;
  const passed = isJavaScript
    ? results.filter((result) => result.pass).length
    : completed
      ? 1
      : 0;

  async function postAttempt(inputCode: string, passedCount: number, total: number) {
    const response = await fetch("/api/practice/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.id,
        code: inputCode,
        passed: passedCount,
        total,
      }),
    });
    const data = (await response.json()) as { error?: string; completed?: boolean };
    if (!response.ok) throw new Error(data.error ?? "保存失败");
    setAttempted(true);
    if (data.completed) setCompleted(true);
    return data.completed ?? false;
  }

  async function handleRun() {
    if (!isJavaScript || !challenge.functionName) return;
    if (code.trim().length < 10) {
      setError("先把函数写完整再运行");
      return;
    }
    setRunning(true);
    setError("");
    setRunError("");
    setResults([]);
    setNotice("");
    try {
      const output = await runJavaScriptTests({
        code,
        functionName: challenge.functionName,
        tests: challenge.tests,
      });
      setResults(output.results);
      setRunError(output.error ?? "");
      const passedCount = output.results.filter((result) => result.pass).length;
      setSaving(true);
      const done = await postAttempt(code, passedCount, totalTests);
      setNotice(
        done
          ? `全部 ${totalTests} 个测试通过，已记录。`
          : `本次通过 ${passedCount}/${totalTests}，已记录为一次尝试。`,
      );
    } catch (runFailure) {
      setRunError(runFailure instanceof Error ? runFailure.message : "运行失败");
    } finally {
      setSaving(false);
      setRunning(false);
    }
  }

  async function revealSolution() {
    setSolutionLoading(true);
    setSolutionError("");
    try {
      const response = await fetch(`/api/practice/code/${challenge.id}/solution`);
      const data = (await response.json()) as { error?: string; solutionCode?: string };
      if (!response.ok || !data.solutionCode) {
        setSolutionError(data.error ?? "暂时无法获取参考实现");
        return;
      }
      setSolution(data.solutionCode);
    } catch {
      setSolutionError("网络异常，请稍后重试");
    } finally {
      setSolutionLoading(false);
    }
  }

  async function handleKotlinSave(passedCount: number) {
    if (code.trim().length < 10) {
      setError("先把实现写完整再保存");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const done = await postAttempt(code, passedCount, 1);
      setNotice(
        done
          ? "已记录：你能独立写出这题。"
          : passedCount === 1
            ? "已记录通过。"
            : "已保存本次尝试，继续对照参考实现补缺口。",
      );
      if (!solution) await revealSolution();
    } catch (saveFailure) {
      setError(saveFailure instanceof Error ? saveFailure.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleKotlinOpen() {
    if (code.trim().length < 10) {
      setError("先把实现写完整，再查看参考实现");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await postAttempt(code, 0, 1);
      setNotice("已保存初次尝试，可以对照参考实现自评。");
      await revealSolution();
    } catch (saveFailure) {
      setError(saveFailure instanceof Error ? saveFailure.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-card border border-white/[0.08] bg-ink-800/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lime/10 text-lime">
                <Code2 className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                {challenge.language === "javascript" ? "JavaScript" : "Kotlin"}
              </span>
              {challenge.functionName ? (
                <span className="font-mono text-[10px] text-muted/40">
                  / {challenge.functionName}()
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {completed ? (
                <Badge tone="mint">
                  <CheckCircle2 className="h-3 w-3" />
                  已通过
                </Badge>
              ) : attempted ? (
                <Badge tone="amber">已提交过</Badge>
              ) : (
                <Badge tone="outline">未提交</Badge>
              )}
              <span className="font-mono text-[9px] text-muted/40">{code.split("\n").length} LINES</span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-10 border-r border-white/[0.04] bg-white/[0.012]" />
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              aria-label="代码编辑器"
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                event.preventDefault();
                const target = event.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const next = `${code.slice(0, start)}  ${code.slice(end)}`;
                setCode(next);
                requestAnimationFrame(() => {
                  target.selectionStart = start + 2;
                  target.selectionEnd = start + 2;
                });
              }}
              className="code-surface block min-h-[340px] w-full resize-y bg-transparent py-4 pl-14 pr-4 font-mono text-[12px] leading-6 text-paper/90 caret-lime focus:outline-none sm:min-h-[400px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] px-4 py-3.5">
            {isJavaScript ? (
              <>
                <Button onClick={handleRun} disabled={running || saving}>
                  {running || saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {running ? "运行中…" : saving ? "保存结果…" : "运行测试"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={revealSolution}
                  disabled={solutionLoading || !attempted}
                  title={!attempted ? "先运行或保存一次尝试" : undefined}
                >
                  {solutionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  查看参考实现
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleKotlinOpen} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存实现，查看参考
                </Button>
                {solution ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => handleKotlinSave(1)}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4" />
                      已能独立写出
                    </Button>
                    <Button variant="ghost" onClick={() => handleKotlinSave(0)} disabled={saving}>
                      还有卡点，再练
                    </Button>
                  </>
                ) : null}
              </>
            )}
            <span className="ml-auto hidden font-mono text-[9px] text-muted/40 sm:block">
              {isJavaScript ? "SANDBOX · 3.5S LIMIT" : "SELF-REVIEW"}
            </span>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.06] px-4 py-3 text-[12px] text-coral">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-xl border border-mint/20 bg-mint/[0.045] px-4 py-3 text-[12px] text-mint">
            {notice}
          </div>
        ) : null}

        {isJavaScript ? (
          <div className="overflow-hidden rounded-card border border-white/[0.08] bg-ink-900/70">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-muted" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">TEST OUTPUT</span>
              </div>
              <span className="font-mono text-[10px] text-muted/50">
                {results.length > 0 ? `${passed}/${totalTests} PASSED` : `${totalTests} CASES`}
              </span>
            </div>
            <div className="p-4">
              {runError ? (
                <div className="rounded-lg border border-coral/20 bg-coral/[0.04] px-3 py-2.5 text-[12px] leading-5 text-coral">
                  {runError}
                </div>
              ) : null}
              {results.length === 0 && !runError ? (
                <div className="space-y-2">
                  {challenge.tests.map((test, index) => (
                    <div key={test.name} className="flex items-center gap-2.5 text-[11px] text-muted/55">
                      <span className="font-mono text-[9px] text-muted/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {test.name}
                    </div>
                  ))}
                  <p className="pt-2 text-[10px] leading-5 text-muted/40">
                    点击「运行测试」后，结果会写入学情记录；同一题的多次尝试都会保留。
                  </p>
                </div>
              ) : null}
              {results.length > 0 ? (
                <div className="space-y-2">
                  <Progress value={passed} total={totalTests} tone={passed === totalTests ? "mint" : "amber"} />
                  <div className="mt-3 space-y-1.5">
                    {results.map((result) => (
                      <div
                        key={result.name}
                        className={cn(
                          "rounded-lg border px-3 py-2.5",
                          result.pass
                            ? "border-mint/15 bg-mint/[0.025]"
                            : "border-coral/20 bg-coral/[0.025]",
                        )}
                      >
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={result.pass ? "text-mint" : "text-coral"}>
                            {result.pass ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </span>
                          <span className={result.pass ? "text-paper/80" : "text-coral"}>{result.name}</span>
                          <span className="ml-auto font-mono text-[9px] text-muted/40">
                            {result.pass ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        {!result.pass ? (
                          <div className="mt-2 space-y-1 font-mono text-[10px] leading-5">
                            {result.error ? <p className="text-coral/80">错误：{result.error}</p> : null}
                            {!result.error ? (
                              <>
                                <p className="text-muted/60">
                                  期望：<span className="text-mint/70">{JSON.stringify(result.expected)}</span>
                                </p>
                                <p className="text-muted/60">
                                  实际：<span className="text-coral/80">{JSON.stringify(result.actual)}</span>
                                </p>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {solution ? (
          <div className="overflow-hidden rounded-card border border-lime/20 bg-ink-900/70">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-lime" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime/80">
                  REFERENCE IMPLEMENTATION
                </span>
              </div>
              <span className="font-mono text-[9px] text-muted/40">非唯一解</span>
            </div>
            <pre className="code-surface overflow-x-auto p-4 font-mono text-[12px] leading-6 text-paper/85">
              <code>{solution}</code>
            </pre>
          </div>
        ) : null}
        {solutionError ? (
          <p role="alert" className="text-[12px] text-coral">
            {solutionError}
          </p>
        ) : null}

        {completed ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-mint/20 bg-mint/[0.04] px-4 py-3.5">
            <CheckCircle2 className="h-4 w-4 text-mint" />
            <p className="text-[12px] text-mint">
              已通过本题，记录里会显示完整尝试。继续下一章，或回到练习做章节题。
            </p>
            <Link href={practiceHref} className={buttonClass("secondary", "sm", "ml-auto")}>
              回到章节练习
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-card border border-white/[0.08] bg-ink-800/60 p-5">
          <div className="eyebrow mb-3 text-lime/70">BRIEF</div>
          <h1 className="text-[18px] font-semibold leading-7 tracking-[-0.02em] text-paper">{challenge.title}</h1>
          <p className="mt-3 text-[12px] leading-6 text-muted">{challenge.prompt}</p>
          <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
            {challenge.requirements.map((requirement) => (
              <div key={requirement} className="flex gap-2 text-[11px] leading-5 text-paper/70">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime/60" />
                {requirement}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-white/[0.08] bg-ink-800/60 p-5">
          <div className="eyebrow mb-3">REVIEW RUBRIC</div>
          <ul className="space-y-2.5">
            {challenge.rubric.map((item, index) => (
              <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-muted">
                <span className="font-mono text-[9px] text-muted/40">{String(index + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-muted/45">
            {isJavaScript
              ? "浏览器沙箱内执行，禁止网络与页面访问；3.5 秒超时自动终止。"
              : "Kotlin 卡不执行代码：参考实现 + 自评维度，结果记录为自评。"}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] px-4 py-3">
          <p className="text-[10px] text-muted/50">{trackName} · 代码题</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            <Save className="h-3 w-3" />
            每次运行/自评都会写入记录
          </div>
          <Link
            href={backHref}
            className="mt-3 inline-flex items-center gap-1 text-[11px] text-paper/70 transition hover:text-lime"
          >
            返回章节
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  MessagesSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  ProgressRing,
  SectionLabel,
} from "@/components/ui/primitives";
import { EndInterviewButton, InterviewAnswerForm } from "@/components/interview-controls";
import { requireUser } from "@/lib/auth";
import { getSkillName } from "@/lib/content";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getInterviewPageData } from "@/lib/services/interviews";
import { AppError } from "@/lib/errors";
import { cn, formatDateTime, percent } from "@/lib/utils";
import type { InterviewFeedback, InterviewTurn } from "@/lib/types";

export const metadata: Metadata = { title: "模拟面试" };

const MODE_LABEL = { resume: "简历深挖", jd: "JD 定向", position: "岗位通用" } as const;

function scoreTone(score: number): "mint" | "lime" | "amber" | "coral" {
  if (score >= 80) return "mint";
  if (score >= 60) return "lime";
  if (score >= 40) return "amber";
  return "coral";
}

function EvaluationCard({
  feedback,
  kind,
}: {
  feedback: InterviewFeedback;
  kind: InterviewTurn["kind"];
}) {
  return (
    <div className="ml-9 mt-2.5 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={scoreTone(feedback.score)}>得分 {feedback.score}</Badge>
        <span className="text-[10px] text-muted/50">
          {kind === "followup" ? "追问反馈" : kind === "retry" ? "第二次回答" : "回答反馈"}
        </span>
        <span className="ml-auto font-mono text-[9px] text-muted/30">
          {feedback.matched.length}/{feedback.matched.length + feedback.missing.length} 要点命中
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {feedback.matched.map((point) => (
          <span key={point} className="rounded-full bg-mint/[0.08] px-2 py-1 text-[10px] text-mint/90">
            ✓ {point}
          </span>
        ))}
        {feedback.missing.map((point) => (
          <span key={point} className="rounded-full bg-amber/[0.07] px-2 py-1 text-[10px] text-amber/80">
            · {point}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[12px] leading-6 text-paper/75">{feedback.advice}</p>
      {feedback.score < 50 ? (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber/15 bg-amber/[0.04] px-3 py-2">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
          <p className="text-[11px] leading-5 text-amber/85">{feedback.hint}</p>
        </div>
      ) : null}

      <details className="mt-3 group" open={feedback.score < 50}>
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-medium text-lime/80 transition hover:text-lime [&::-webkit-details-marker]:hidden">
          <BookOpen className="h-3.5 w-3.5" />
          查看参考回答
          <ChevronRight className="h-3 w-3 transition group-open:rotate-90" />
        </summary>
        <p className="mt-2 rounded-lg border border-white/[0.06] bg-ink-950/50 px-3.5 py-3 text-[12px] leading-6 text-muted">
          {feedback.modelAnswer}
        </p>
      </details>
    </div>
  );
}

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requireUser();
  const { sessionId } = await params;
  let data;
  try {
    data = getInterviewPageData(user.id, sessionId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { session, track, turns, state, summary } = data;
  const initial = user.name.trim().slice(0, 1).toUpperCase();

  if (summary) {
    const recommended = summary.recommendedAtomIds
      .map((atomId) => {
        const atom = track.atoms.find((item) => item.id === atomId);
        if (!atom) return null;
        const chapter = track.chapters.find((item) => item.id === atom.chapterId);
        if (!chapter) return null;
        return {
          atom,
          chapter,
          href: `/learn/${track.id}/${chapter.id}/${atom.id}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return (
      <div>
        <PageHeader
          eyebrow={`INTERVIEW REPORT · ${formatDateTime(summary.createdAt)}`}
          title="这一轮，问题暴露在哪？"
          description={summary.verdict}
          actions={
            <>
              <Link href="/records" className={buttonClass("secondary", "md")}>
                查看记录
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/interview" className={buttonClass("primary", "md")}>
                再练一场
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Panel className="overflow-hidden">
              <div className="flex flex-col justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="lime">{track.shortName}</Badge>
                    <Badge tone="outline">{LEVEL_LABEL[session.level]}</Badge>
                    <Badge tone="outline">{MODE_LABEL[session.mode]}</Badge>
                    {session.plan.company ? <Badge tone="outline">{session.plan.company}</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-paper">
                    完成 {summary.answeredCount}/{summary.mainCount} 道主问题
                  </h2>
                  <p className="mt-2 text-[12px] leading-6 text-muted">
                    评分来自要点覆盖与表达完整度；追问和重答都保留了过程记录。把遗漏要点带回微课，再看一遍原始问题。
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <ProgressRing percent={summary.average} size={104} label="平均分" />
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-t border-white/[0.06] sm:grid-cols-4">
                <div className="p-4">
                  <p className="eyebrow mb-1.5">AVERAGE</p>
                  <p className="font-mono text-xl text-lime">{summary.average}</p>
                </div>
                <div className="p-4">
                  <p className="eyebrow mb-1.5">ANSWERS</p>
                  <p className="font-mono text-xl text-paper">{summary.answeredCount}</p>
                </div>
                <div className="p-4">
                  <p className="eyebrow mb-1.5">STRENGTHS</p>
                  <p className="font-mono text-xl text-mint">{summary.strengths.length}</p>
                </div>
                <div className="p-4">
                  <p className="eyebrow mb-1.5">GAPS</p>
                  <p className="font-mono text-xl text-amber">{summary.gaps.length}</p>
                </div>
              </div>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2">
              <Panel className="p-4">
                <div className="flex items-center gap-2 text-mint">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="text-[12px] font-medium">能讲清楚的部分</h3>
                </div>
                <div className="mt-3 space-y-2">
                  {summary.strengths.length > 0 ? (
                    summary.strengths.map((item) => (
                      <div key={item.skillId} className="flex items-center justify-between rounded-lg border border-mint/10 bg-mint/[0.025] px-3 py-2">
                        <span className="text-[11px] text-paper/80">{item.name}</span>
                        <span className="font-mono text-[11px] text-mint">{item.score}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] leading-5 text-muted/55">暂未形成明显优势，先把基础要点说完整。</p>
                  )}
                </div>
              </Panel>
              <Panel className="p-4">
                <div className="flex items-center gap-2 text-amber">
                  <Sparkles className="h-4 w-4" />
                  <h3 className="text-[12px] font-medium">被追问暴露的缝隙</h3>
                </div>
                <div className="mt-3 space-y-2">
                  {summary.gaps.length > 0 ? (
                    summary.gaps.map((item) => (
                      <div key={item.skillId} className="flex items-center justify-between rounded-lg border border-amber/10 bg-amber/[0.02] px-3 py-2">
                        <span className="text-[11px] text-paper/80">{item.name}</span>
                        <span className="font-mono text-[11px] text-amber">{item.score}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] leading-5 text-muted/55">本轮没有明显缺口，换一种面试模式继续验证。</p>
                  )}
                </div>
              </Panel>
            </div>

            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <SectionLabel index="TRANSCRIPT">完整问答</SectionLabel>
                <span className="font-mono text-[9px] text-muted/40">{turns.length} TURNS</span>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {turns.map((turn) => (
                  <details key={turn.id} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                      <span className="mt-0.5 font-mono text-[9px] text-muted/30">
                        {String(turn.seq).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[12px] leading-5 text-paper/80">
                          {turn.questionText}
                        </span>
                        <span className="mt-1 block font-mono text-[9px] text-muted/35">
                          {turn.kind === "followup" ? "追问" : turn.kind === "retry" ? "重答" : "主问题"} · 得分{" "}
                          {turn.score}
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/30 transition group-open:rotate-90" />
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-white/[0.05] pt-3">
                      <div className="rounded-lg bg-ink-950/40 px-3 py-2.5">
                        <p className="eyebrow mb-1">YOUR ANSWER</p>
                        <p className="text-[12px] leading-6 text-muted">{turn.answer}</p>
                      </div>
                      <EvaluationCard feedback={turn.feedback} kind={turn.kind} />
                    </div>
                  </details>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <SectionLabel index="NEXT">推荐复习</SectionLabel>
                <span className="font-mono text-[9px] text-muted/40">{recommended.length}</span>
              </div>
              <div className="mt-4 space-y-2">
                {recommended.length > 0 ? (
                  recommended.map((item) => (
                    <Link
                      key={item.atom.id}
                      href={item.href}
                      className="group block rounded-xl border border-white/[0.06] p-3 transition hover:border-lime/20 hover:bg-lime/[0.025]"
                    >
                      <p className="text-[12px] font-medium text-paper/90">{item.atom.title}</p>
                      <p className="mt-1 text-[10px] text-muted/50">
                        {item.chapter.title} · {item.atom.minutes} 分钟
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-lime/70">
                        去复习
                        <ArrowRight className="h-2.5 w-2.5" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-[11px] leading-5 text-muted/55">
                    继续做章节练习保持手感，或者换一种面试模式再练。
                  </p>
                )}
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-mint" />
                <p className="text-[12px] font-medium text-paper">复盘方法</p>
              </div>
              <ol className="mt-3 space-y-2.5 text-[10px] leading-5 text-muted/65">
                <li>1. 挑一个最低分问题，合上参考回答，用自己的话重讲一遍。</li>
                <li>2. 把遗漏要点写成三条「结论 + 原因 + 代价」。</li>
                <li>3. 回到对应微课补机制，再开一场同类面试。</li>
              </ol>
              <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[9px] text-muted/35">
                <CheckCircle2 className="h-3 w-3" />
                所有回答与评分已写入学习记录
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    );
  }

  const { pending } = state;
  const progressPercent = percent(state.answeredCount, state.mainCount);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/interview" className="text-[11px] text-muted transition hover:text-paper">
            模拟面试
          </Link>
          <ChevronRight className="h-3 w-3 text-muted/40" />
          <span className="text-[11px] text-paper/70">
            {track.shortName} · {LEVEL_LABEL[session.level]} · {MODE_LABEL[session.mode]}
          </span>
          <Badge tone="lime" className="ml-1">
            进行中
          </Badge>
        </div>
        <EndInterviewButton sessionId={session.id} hasTurns={turns.length > 0} />
      </div>

      <div className="mb-4 rounded-card border border-white/[0.07] bg-ink-800/55 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink-950">
              <Mic className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12px] font-medium text-paper">OfferPath 面试官</p>
              <p className="mt-0.5 font-mono text-[9px] text-muted/40">
                {session.plan.mainQuestions.length} MAIN QUESTIONS · {" "}
                {session.plan.company || "目标岗位"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted/50">
              {state.answeredCount}/{state.mainCount} 主问题
            </span>
            <Progress value={state.answeredCount} total={state.mainCount} className="w-28" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {turns.length === 0 ? (
            <Panel tone="accent" className="mb-3 p-4">
              <p className="text-[12px] leading-6 text-paper/80">
                面试开始。回答不需要背标准答案：先给判断，再讲机制、取舍和项目证据。低分会收到提示，可以带着反馈重答一次。
              </p>
            </Panel>
          ) : null}

          <div className="space-y-4">
            {turns.map((turn) => (
              <div key={turn.id}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime/25 bg-lime/[0.08] font-mono text-[10px] text-lime">
                    OP
                  </span>
                  <div className="min-w-0 max-w-[92%] rounded-2xl rounded-tl-md border border-white/[0.07] bg-ink-800/80 px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      {turn.kind === "followup" ? <Badge tone="lime">追问</Badge> : null}
                      {turn.kind === "retry" ? <Badge tone="amber">重新回答</Badge> : null}
                      <span className="font-mono text-[9px] text-muted/35">Q{String(turn.seq).padStart(2, "0")}</span>
                    </div>
                    <p className="text-[13px] leading-6 text-paper/85">{turn.questionText}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-start justify-end gap-3">
                  <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tr-md bg-lime/[0.09] px-4 py-3">
                    <p className="whitespace-pre-wrap text-[13px] leading-6 text-paper/85">{turn.answer}</p>
                  </div>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted">
                    {initial}
                  </span>
                </div>

                <EvaluationCard feedback={turn.feedback} kind={turn.kind} />
              </div>
            ))}
          </div>

          {pending ? (
            <div className="mt-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime/25 bg-lime/[0.08] font-mono text-[10px] text-lime">
                  OP
                </span>
                <div className="min-w-0 rounded-2xl rounded-tl-md border border-lime/20 bg-lime/[0.035] px-4 py-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {pending.attempt === "retry" ? <Badge tone="amber">再试一次</Badge> : null}
                    {pending.attempt === "followup" ? <Badge tone="lime">深入追问</Badge> : null}
                    {pending.attempt === "first" ? (
                      <span className="font-mono text-[9px] text-muted/40">
                        QUESTION {String(state.answeredCount + 1).padStart(2, "0")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[14px] leading-7 text-paper/90">{pending.question.prompt}</p>
                </div>
              </div>
              <div className="mt-4">
                <InterviewAnswerForm
                  sessionId={session.id}
                  questionId={pending.question.id}
                  attempt={pending.attempt}
                  hint={pending.hint}
                />
              </div>
            </div>
          ) : (
            <Panel tone="accent" className="mt-5 flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-[14px] font-medium text-paper">所有主问题已经完成。</p>
                <p className="mt-1 text-[12px] text-muted">生成报告，查看得分、缺口与推荐复习。</p>
              </div>
              <EndInterviewButton sessionId={session.id} hasTurns={turns.length > 0} />
            </Panel>
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <SectionLabel index="SESSION">本场信息</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">方向</span>
                <span className="text-[11px] text-paper/80">{track.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">等级</span>
                <span className="text-[11px] text-paper/80">{LEVEL_LABEL[session.level]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">方式</span>
                <span className="text-[11px] text-paper/80">{MODE_LABEL[session.mode]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">进度</span>
                <span className="text-[11px] text-paper/80">{progressPercent}%</span>
              </div>
            </div>
            <Progress value={state.answeredCount} total={state.mainCount} className="mt-4" />
            <p className="mt-3 text-[10px] leading-5 text-muted/45">
              组题依据：{session.mode === "resume" ? "简历项目与技能线索" : session.mode === "jd" ? "JD 技能要求" : "岗位等级核心技能"}
            </p>
          </Panel>

          <Panel tone="warn" className="p-5">
            <div className="flex items-center gap-2 text-amber">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[12px] font-medium">回答规则</p>
            </div>
            <ul className="mt-3 space-y-2 text-[10px] leading-5 text-muted/65">
              <li>· 主问题低于 50 分：必须带提示再答一次，才进入下一题。</li>
              <li>· 主问题 70 分以上：面试官会插入一个更深追问。</li>
              <li>· 结束面试后生成报告，已答内容会保留。</li>
            </ul>
          </Panel>

          <div className="flex items-start gap-2 px-1 text-[10px] leading-5 text-muted/40">
            <MessagesSquare className="mt-0.5 h-3 w-3 shrink-0" />
            面试回答按规则评估要点覆盖，仅用于练习，不代表真实面试结论。
          </div>
        </aside>
      </div>
    </div>
  );
}

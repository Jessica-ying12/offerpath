import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Lightbulb,
  Mic2,
  PenLine,
  Quote,
} from "lucide-react";
import { Badge, buttonClass, Panel, Progress, SectionLabel } from "@/components/ui/primitives";
import { LessonCompleteButton } from "@/components/lesson-complete-button";
import { requireUser } from "@/lib/auth";
import { getSkillName } from "@/lib/content";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getLessonPageData } from "@/lib/services/learning";
import { AppError } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "微课" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ trackId: string; chapterId: string; atomId: string }>;
}) {
  const user = await requireUser();
  const { trackId, chapterId, atomId } = await params;
  let data;
  try {
    data = getLessonPageData(user.id, trackId, chapterId, atomId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { track, chapter, atom } = data;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/learn" className="transition hover:text-paper">
          系统学习
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <Link href={`/learn/${track.id}?level=${chapter.level}`} className="transition hover:text-paper">
          {track.shortName}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <span className="text-paper/70">{chapter.title}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Badge tone="lime">{LEVEL_LABEL[chapter.level]}</Badge>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-muted/50">
                    MICRO LESSON · {data.position}/{data.totalAtoms}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted/50">
                  <Clock3 className="h-3 w-3" />
                  {atom.minutes} MIN
                </div>
              </div>
              <Progress
                value={data.position}
                total={data.totalAtoms}
                className="mt-3.5 max-w-[240px]"
              />
            </div>

            <article className="px-5 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-wrap gap-1.5">
                {atom.skills.map((skillId) => (
                  <span key={skillId} className="text-[10px] text-lime/60">
                    #{getSkillName(track, skillId)}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-balance text-[30px] font-semibold leading-[1.2] tracking-[-0.035em] text-paper sm:text-[38px]">
                {atom.title}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-muted">{atom.summary}</p>

              <div className="my-8 h-px bg-white/[0.07]" />

              <section aria-labelledby="key-points">
                <SectionLabel index="01">REMEMBER THIS</SectionLabel>
                <h2 id="key-points" className="mt-3 text-[17px] font-semibold text-paper">
                  先记住这几条
                </h2>
                <div className="mt-4 space-y-2.5">
                  {atom.keyPoints.map((point, index) => (
                    <div
                      key={point}
                      className="flex items-start gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3.5"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lime/20 bg-lime/[0.06] font-mono text-[10px] text-lime">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[13px] leading-6 text-paper/85">{point}</p>
                    </div>
                  ))}
                </div>
              </section>

              {atom.example ? (
                <section className="mt-9" aria-labelledby="example">
                  <SectionLabel index="02">EXAMPLE</SectionLabel>
                  <div className="mt-3 flex items-center justify-between">
                    <h2 id="example" className="text-[17px] font-semibold text-paper">
                      {atom.example.caption}
                    </h2>
                    <span className="rounded-md border border-white/10 px-2 py-1 font-mono text-[9px] uppercase text-muted/60">
                      {atom.example.language}
                    </span>
                  </div>
                  <pre className="code-surface mt-3 overflow-x-auto rounded-xl border border-white/[0.08] p-4 text-[12px] leading-6 text-paper/85 sm:p-5">
                    <code>{atom.example.code}</code>
                  </pre>
                </section>
              ) : null}

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                <section className="rounded-xl border border-amber/15 bg-amber/[0.035] p-4">
                  <div className="flex items-center gap-2 text-amber">
                    <AlertTriangle className="h-4 w-4" />
                    <h2 className="text-[12px] font-semibold">常见坑</h2>
                  </div>
                  <ul className="mt-3 space-y-2.5">
                    {atom.pitfalls.map((pitfall) => (
                      <li key={pitfall} className="flex gap-2 text-[12px] leading-5 text-paper/70">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber/60" />
                        {pitfall}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-xl border border-lime/15 bg-lime/[0.035] p-4">
                  <div className="flex items-center gap-2 text-lime">
                    <Mic2 className="h-4 w-4" />
                    <h2 className="text-[12px] font-semibold">面试这样说</h2>
                  </div>
                  <p className="mt-3 text-[12px] leading-6 text-paper/75">{atom.interviewTip}</p>
                </section>
              </div>

              <div className="mt-9 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center">
                <Link
                  href={data.previousHref}
                  className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-paper"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  上一节
                </Link>
                <LessonCompleteButton
                  atomId={atom.id}
                  nextHref={data.nextHref}
                  completed={data.isCompleted}
                />
              </div>
            </article>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <SectionLabel index="CHAPTER">本章进度</SectionLabel>
                <span className="font-mono text-[10px] text-muted/50">
                  {data.completedInChapter}/{data.totalAtoms}
                </span>
              </div>
            </div>
            <div className="space-y-0.5 p-2">
              {data.atoms.map((item) => {
                const active = item.id === atom.id;
                return (
                  <Link
                    key={item.id}
                    href={`/learn/${track.id}/${chapter.id}/${item.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[12px] transition",
                      active ? "bg-white/[0.06] text-paper" : "text-muted hover:bg-white/[0.03] hover:text-paper/85",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px]",
                        item.completed
                          ? "border-mint/30 bg-mint/10 text-mint"
                          : active
                            ? "border-lime/40 text-lime"
                            : "border-white/10 text-muted/50",
                      )}
                    >
                      {item.completed ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : "·"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span className="font-mono text-[9px] text-muted/30">{item.minutes}M</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-white/[0.06] p-3">
              <Link
                href={data.practiceHref}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] text-muted transition hover:bg-white/[0.03] hover:text-paper"
              >
                <span className="inline-flex items-center gap-1.5">
                  <PenLine className="h-3 w-3" />
                  章节练习 · 5 题
                </span>
                <ChevronRight className="h-3 w-3" />
              </Link>
              {data.challengeTitle ? (
                <div className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-muted/60">
                  <Code2 className="h-3 w-3" />
                  {data.challengeTitle}
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber" />
              <p className="text-[12px] font-medium text-paper">学习节奏</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              本节只需 {atom.minutes} 分钟。先合上页面复述一遍要点，再进入下一节；学完 3 节就去做题。
            </p>
            {data.practiceAttempt ? (
              <div className="mt-3 rounded-lg border border-white/[0.06] px-3 py-2 text-[10px] text-muted/60">
                上次章节练习：{data.practiceAttempt.score}/{data.practiceAttempt.total}
              </div>
            ) : null}
            {data.chapterCompleted ? (
              <Link
                href={data.practiceHref}
                className={buttonClass("primary", "sm", "mt-3 w-full")}
              >
                本章已学完，去练习
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </Panel>

          <Panel className="p-4">
            <Quote className="h-4 w-4 text-lime/70" />
            <p className="mt-2.5 text-[12px] leading-6 text-paper/75">{atom.interviewTip}</p>
            <p className="mt-2 text-[10px] text-muted/40">面试表达提示</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

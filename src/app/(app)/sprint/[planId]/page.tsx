import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Info,
  MessagesSquare,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
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
import { requireUser } from "@/lib/auth";
import { getSkillName, requireTrack } from "@/lib/content";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getSprintPlanView } from "@/lib/services/plans";
import { AppError } from "@/lib/errors";
import { formatDate, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "急冲计划详情" };

const TASK_ICON = {
  atom: BookOpen,
  practice: PenLine,
  code: Code2,
  interview: MessagesSquare,
} as const;

export default async function SprintPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const user = await requireUser();
  const { planId } = await params;
  let view;
  try {
    view = getSprintPlanView(user.id, planId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { plan, progress, days, track, nextTask } = view;
  const trackContent = requireTrack(track.id);
  const totalMinutes = [...progress.tasks.values()].reduce(
    (sum, item) => sum + item.task.minutes,
    0,
  );
  const completedMinutes = [...progress.tasks.values()]
    .filter((item) => item.done)
    .reduce((sum, item) => sum + item.task.minutes, 0);

  return (
    <div>
      <PageHeader
        eyebrow={`SPRINT PLAN · ${plan.days.length} DAYS · ${LEVEL_LABEL[plan.level]}`}
        title={view.title}
        description={`${plan.analysis.summary} 计划生成于 ${formatDate(view.createdAt)}，所有进度按真实学习、练习、代码与面试记录自动更新。`}
        actions={
          <>
            <Link href={`/interview?planId=${view.id}`} className={buttonClass("secondary", "md")}>
              <MessagesSquare className="h-4 w-4" />
              按此计划面试
            </Link>
            {nextTask ? (
              <Link href={nextTask.href} className={buttonClass("primary", "md")}>
                下一步：{nextTask.task.title.slice(0, 12)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className={buttonClass("secondary", "md", "opacity-70")}>
                <Check className="h-4 w-4" />
                计划已完成
              </span>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="lime">{track.shortName}</Badge>
        <Badge tone="outline">{LEVEL_LABEL[plan.level]}</Badge>
        <Badge tone="outline">{plan.days.length} 天</Badge>
        {plan.company ? <Badge tone="outline">目标 · {plan.company}</Badge> : null}
        <span className="ml-auto font-mono text-[9px] text-muted/40">
          ≈ {Math.round(totalMinutes / 60 * 10) / 10}H TOTAL · {Math.round(completedMinutes / 60 * 10) / 10}H DONE
        </span>
      </div>

      <Panel className="mb-4 overflow-hidden">
        <div className="grid gap-0 divide-y divide-white/[0.06] md:grid-cols-[240px_1fr_1fr] md:divide-x md:divide-y-0">
          <div className="flex items-center gap-4 p-5">
            <ProgressRing
              percent={percent(progress.done, progress.total)}
              size={82}
              label="任务完成"
            />
            <div>
              <p className="font-mono text-lg text-paper">
                {progress.done}
                <span className="text-sm text-muted">/{progress.total}</span>
              </p>
              <p className="mt-1 text-[11px] text-muted">已完成任务</p>
              <p className="mt-2 text-[10px] text-muted/50">
                {plan.analysis.coverage}% 技能覆盖
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-mint" />
              <span className="eyebrow text-mint/80">MATCHED · {plan.analysis.matchedSkills.length}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.analysis.matchedSkills.length > 0 ? (
                plan.analysis.matchedSkills.map((skillId) => (
                  <span
                    key={skillId}
                    className="rounded-full border border-mint/20 bg-mint/[0.05] px-2.5 py-1 text-[10px] text-mint/90"
                  >
                    {getSkillName(trackContent, skillId)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted/50">简历里暂未识别到目标技能，建议补充技术栈与项目结果。</span>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted/45">
              已有证据的技能不再从零讲解，重点放在表达与追问。
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber" />
              <span className="eyebrow text-amber/80">GAPS · {plan.analysis.gapSkills.length}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.analysis.gapSkills.length > 0 ? (
                plan.analysis.gapSkills.map((skillId) => (
                  <span
                    key={skillId}
                    className="rounded-full border border-amber/20 bg-amber/[0.05] px-2.5 py-1 text-[10px] text-amber/90"
                  >
                    {getSkillName(trackContent, skillId)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-mint/70">主要要求都有简历线索，重点转向项目追问。</span>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted/45">
              来自 JD 要求与岗位核心技能；缺口会被优先排进每日任务。
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {days.map((day) => {
            const done = day.tasks.filter((task) => task.done).length;
            const allDone = done === day.tasks.length;
            return (
              <Panel key={day.day} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={allDone ? "font-mono text-[11px] text-mint" : "font-mono text-[11px] text-lime/70"}>
                      {day.label}
                    </span>
                    <span className="h-3 w-px bg-white/10" />
                    <span className="text-[11px] text-muted">{day.focus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {allDone ? <Badge tone="mint">完成</Badge> : null}
                    <span className="font-mono text-[9px] text-muted/40">
                      {done}/{day.tasks.length}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {day.tasks.map((taskView) => {
                    const Icon = TASK_ICON[taskView.task.type];
                    return (
                      <Link
                        key={taskView.task.id}
                        href={taskView.href}
                        className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.025]"
                      >
                        <span
                          className={
                            taskView.done
                              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint"
                              : "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-muted"
                          }
                        >
                          {taskView.done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Icon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={
                              taskView.done
                                ? "block truncate text-[13px] text-muted line-through decoration-white/15"
                                : "block truncate text-[13px] text-paper/90"
                            }
                          >
                            {taskView.task.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[9px] text-muted/40">
                            {taskView.meta}
                          </span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted/25 transition group-hover:text-lime" />
                      </Link>
                    );
                  })}
                </div>
              </Panel>
            );
          })}

          {progress.done === progress.total ? (
            <Panel tone="accent" className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-[14px] font-medium text-paper">这份计划已完成闭环。</p>
                <p className="mt-1 text-[12px] text-muted">去做一次模拟面试，检查表达与追问是否扛得住。</p>
              </div>
              <Link href={`/interview?planId=${view.id}`} className={buttonClass("primary", "sm")}>
                开始面试
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="MEMORIZE">必背清单</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">
                {plan.selectedAtomIds.length} 个知识点
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              高优先级要点。点开抄成自己的话，不要背整段范文。
            </p>
            <div className="mt-4 space-y-2">
              {plan.selectedAtomIds.map((atomId) => {
                const atom = trackContent.atoms.find((item) => item.id === atomId);
                if (!atom) return null;
                const chapter = trackContent.chapters.find((item) => item.id === atom.chapterId);
                const atomView = progress.tasks.get(`atom-${atom.id}`);
                return (
                  <details key={atom.id} className="group rounded-lg border border-white/[0.06] bg-white/[0.012]">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[11px] text-paper/80 transition hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
                      <span
                        className={
                          atomView?.done
                            ? "h-1.5 w-1.5 shrink-0 rounded-full bg-mint"
                            : "h-1.5 w-1.5 shrink-0 rounded-full bg-lime/50"
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{atom.title}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 text-muted/40 transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-white/[0.05] px-3 py-3">
                      <p className="font-mono text-[9px] text-muted/40">{chapter?.title}</p>
                      <ul className="mt-2 space-y-1.5">
                        {atom.keyPoints.map((point) => (
                          <li key={point} className="flex gap-1.5 text-[10px] leading-5 text-muted/80">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lime/40" />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/learn/${track.id}/${chapter?.id}/${atom.id}`}
                        className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-lime/70 hover:text-lime"
                      >
                        打开知识点
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </details>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-mint" />
              <p className="text-[12px] font-medium text-paper">匹配依据</p>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-muted/55">
              基于技能词典命中简历/JD 的文本证据，非大模型生成。
            </p>
            <details className="mt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-[10px] text-muted transition hover:bg-white/[0.02]">
                查看抽取证据
                <ChevronDown className="h-3 w-3" />
              </summary>
              <div className="mt-2 space-y-2">
                {plan.analysis.evidence.length > 0 ? (
                  plan.analysis.evidence.map((item) => (
                    <div key={item.skillId} className="rounded-lg border border-white/[0.05] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-paper/75">{item.name}</span>
                        <span className="font-mono text-[8px] text-muted/40">
                          {item.sources.map((source) => (source === "resume" ? "简历" : "JD")).join(" / ")}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[9px] leading-4 text-muted/45">
                        命中：{item.hits.slice(0, 5).join("、")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-muted/50">暂无命中证据，请补全简历或 JD。</p>
                )}
              </div>
            </details>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-amber" />
              <p className="text-[12px] font-medium text-paper">计划说明</p>
            </div>
            <ul className="mt-3 space-y-2 text-[10px] leading-5 text-muted/60">
              <li>· 任务完成状态由真实知识点完成、章节练习提交、代码通过和面试记录派生。</li>
              <li>· 先做「下一任务」即可，不必按天死磕；时间紧张可优先必背清单。</li>
              <li>· 计划生成时的简历/JD 会保留在快照中，用于后续模拟面试。</li>
            </ul>
            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <Clock3 className="h-3 w-3 text-muted/40" />
              <span className="text-[10px] text-muted/50">每天约 {Math.round((totalMinutes / plan.days.length) * 10) / 10} 分钟</span>
            </div>
          </Panel>

          <Link
            href="/sprint"
            className="group flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.025]"
          >
            <span className="text-[11px] text-muted">换一份计划</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-lime" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

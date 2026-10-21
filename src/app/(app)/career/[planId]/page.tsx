import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Flag,
  MessagesSquare,
  PenLine,
  ShieldCheck,
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
import { getCareerPlanView } from "@/lib/services/plans";
import { AppError } from "@/lib/errors";
import { formatDate, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "规划路线" };

const TASK_ICON = {
  atom: BookOpen,
  practice: PenLine,
  code: Code2,
  interview: MessagesSquare,
} as const;

export default async function CareerPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const user = await requireUser();
  const { planId } = await params;
  let view;
  try {
    view = getCareerPlanView(user.id, planId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { plan, phases, track, total, done, nextTask } = view;
  const trackContent = requireTrack(track.id);

  return (
    <div>
      <PageHeader
        eyebrow={`CAREER ROADMAP · ${plan.horizonWeeks} WEEKS · ${LEVEL_LABEL[plan.level]}`}
        title={view.title}
        description={`${plan.analysis.summary} 路线生成于 ${formatDate(view.createdAt)}；阶段完成度按微课、章节练习、代码题与面试记录自动计算。`}
        actions={
          <>
            <Link href="/interview" className={buttonClass("secondary", "md")}>
              <MessagesSquare className="h-4 w-4" />
              模拟面试
            </Link>
            {nextTask ? (
              <Link href={nextTask.href} className={buttonClass("primary", "md")}>
                下一步：{nextTask.task.title.slice(0, 12)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className={buttonClass("secondary", "md", "opacity-70")}>
                <Check className="h-4 w-4" />
                路线已完成
              </span>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="mint">{track.shortName}</Badge>
        <Badge tone="outline">{LEVEL_LABEL[plan.level]}目标</Badge>
        <Badge tone="outline">{phases.length} 个阶段</Badge>
        {plan.analysis.coverage > 0 ? <Badge tone="outline">技能覆盖 {plan.analysis.coverage}%</Badge> : null}
        <span className="ml-auto font-mono text-[9px] text-muted/40">
          {done}/{total} TASKS · 真实记录驱动
        </span>
      </div>

      <Panel className="mb-4">
        <div className="grid gap-0 divide-y divide-white/[0.06] sm:grid-cols-[220px_1fr] sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-4 p-5">
            <ProgressRing percent={percent(done, total)} size={82} label="路线完成" />
            <div>
              <p className="font-mono text-lg text-paper">
                {done}
                <span className="text-sm text-muted">/{total}</span>
              </p>
              <p className="mt-1 text-[11px] text-muted">阶段任务</p>
              <p className="mt-2 text-[10px] text-muted/50">{plan.horizonWeeks} 周结构</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-lime" />
              <span className="eyebrow text-lime/80">ROUTE CHECKPOINTS</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {phases.map((phase) => (
                <span
                  key={phase.id}
                  className={
                    phase.total > 0 && phase.done === phase.total
                      ? "rounded-full border border-mint/20 bg-mint/[0.05] px-2.5 py-1 text-[10px] text-mint"
                      : "rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-muted"
                  }
                >
                  {phase.title} · {phase.done}/{phase.total}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted/45">
              阶段内先完成微课，再做章节练习；代码题和模拟面试用来检验迁移能力。
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative space-y-3 pl-5 before:absolute before:bottom-5 before:left-[5px] before:top-3 before:w-px before:bg-white/[0.08]">
          {phases.map((phase, index) => {
            const phaseComplete = phase.total > 0 && phase.done === phase.total;
            return (
              <div key={phase.id} className="relative">
                <span
                  className={
                    phaseComplete
                      ? "absolute -left-5 top-6 flex h-3 w-3 items-center justify-center rounded-full border-2 border-mint bg-ink-950"
                      : "absolute -left-5 top-6 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white/20 bg-ink-950"
                  }
                >
                  {phaseComplete ? <span className="h-1 w-1 rounded-full bg-mint" /> : null}
                </span>
                <Panel className="overflow-hidden">
                  <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-muted/40">
                          PHASE {String(index + 1).padStart(2, "0")}
                        </span>
                        <Badge tone={phase.id === "phase-sprint" ? "lime" : "outline"}>
                          {phase.weeks} 周
                        </Badge>
                        {phaseComplete ? <Badge tone="mint">完成</Badge> : null}
                      </div>
                      <span className="font-mono text-[10px] text-muted/40">
                        {phase.done}/{phase.total}
                      </span>
                    </div>
                    <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-paper">
                      {phase.title}
                    </h2>
                    <p className="mt-1.5 text-[12px] leading-6 text-muted">{phase.objective}</p>
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                      <Flag className="mt-0.5 h-3 w-3 shrink-0 text-amber/70" />
                      <p className="text-[10px] leading-5 text-muted/70">验收：{phase.checkpoint}</p>
                    </div>
                    <Progress value={phase.done} total={phase.total} className="mt-3" tone={phaseComplete ? "mint" : "lime"} />
                  </div>

                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-[11px] text-muted transition hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
                      <span>阶段任务（{phase.total}）</span>
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                    </summary>
                    <div className="divide-y divide-white/[0.04] border-t border-white/[0.05]">
                      {phase.tasks.map((taskView) => {
                        const Icon = TASK_ICON[taskView.task.type];
                        return (
                          <Link
                            key={taskView.task.id}
                            href={taskView.href}
                            className="group/task flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.025]"
                          >
                            <span
                              className={
                                taskView.done
                                  ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-mint/10 text-mint"
                                  : "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.035] text-muted"
                              }
                            >
                              {taskView.done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={
                                  taskView.done
                                    ? "block truncate text-[12px] text-muted line-through decoration-white/15"
                                    : "block truncate text-[12px] text-paper/85"
                                }
                              >
                                {taskView.task.title}
                              </span>
                              <span className="mt-0.5 block font-mono text-[9px] text-muted/35">
                                {taskView.meta}
                              </span>
                            </span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-muted/20 transition group-hover/task:text-lime" />
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                </Panel>
              </div>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="COVERAGE">技能覆盖</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">
                {plan.analysis.matchedSkills.length}/{plan.analysis.requiredSkills.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {plan.skillCoverage.length > 0 ? (
                plan.skillCoverage.map((skill) => (
                  <div key={skill.skillId} className="flex items-center gap-2.5">
                    <span
                      className={
                        skill.covered
                          ? "flex h-4 w-4 items-center justify-center rounded-full bg-mint/10 text-mint"
                          : "flex h-4 w-4 items-center justify-center rounded-full border border-white/10 text-muted/30"
                      }
                    >
                      {skill.covered ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    <span className={skill.covered ? "text-[11px] text-paper/80" : "text-[11px] text-muted"}>
                      {skill.name}
                    </span>
                    <span className="ml-auto text-[9px] text-muted/30">
                      {skill.covered ? "简历有证据" : skill.phaseIds.length > 0 ? "路线覆盖" : "待补"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted/50">补充 JD 或简历后可查看逐项覆盖。</p>
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-mint" />
              <p className="text-[12px] font-medium text-paper">可解释依据</p>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-muted/55">
              覆盖 = 简历技能命中 ÷ 目标要求。未提供 JD 时按目标等级核心技能计算。
            </p>
            {plan.analysis.gapSkills.length > 0 ? (
              <div className="mt-3">
                <p className="text-[9px] text-muted/40">优先缺口</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {plan.analysis.gapSkills.map((skillId) => (
                    <span key={skillId} className="rounded-full border border-amber/20 bg-amber/[0.04] px-2 py-0.5 text-[10px] text-amber/80">
                      {getSkillName(trackContent, skillId)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[9px] leading-4 text-muted/35">
              规则引擎结果，非大模型评估。
            </p>
          </Panel>

          <Panel tone="accent" className="p-5">
            <div className="flex items-center gap-2 text-lime">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-[12px] font-medium">如何用这份路线</p>
            </div>
            <ol className="mt-3 space-y-2 text-[10px] leading-5 text-muted/70">
              <li>1. 每次只做「下一步」，不用一次看完。</li>
              <li>2. 阶段结束看验收标准，不通过就补对应章节。</li>
              <li>3. 至少在每个阶段末做一次模拟面试。</li>
            </ol>
            <Link href={`/interview?trackId=${track.id}&level=${plan.level}`} className={buttonClass("secondary", "sm", "mt-4 w-full")}>
              开始阶段面试
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

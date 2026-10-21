import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Flame,
  History,
  MessagesSquare,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  ProgressRing,
  SectionLabel,
  Stat,
  TimeAgo,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/services/dashboard";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { formatDate, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "总览" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

const ACTIVITY_ICON: Record<string, typeof BookOpen> = {
  lesson_completed: BookOpen,
  quiz_submitted: CheckCircle2,
  code_submitted: Zap,
  plan_created: Target,
  interview_started: MessagesSquare,
  interview_completed: MessagesSquare,
  profile_updated: Target,
  mistake_resolved: CheckCircle2,
  account_created: Target,
  solution_viewed: BookOpen,
};

export default async function DashboardPage() {
  const user = await requireUser();
  const data = getDashboardData(user);
  const { stats, review, sprintView, track, profile, level } = data;
  const initial = user.name.trim().slice(0, 1).toUpperCase();
  const dailyTasks = data.todayFocus;

  return (
    <div>
      <PageHeader
        eyebrow={<>TODAY · {formatDate(new Date().toISOString())}</>}
        title={
          <>
            {greeting()}，{user.name}。
            <span className="mt-1 block text-[18px] font-normal tracking-normal text-muted sm:text-[20px]">
              今天只做三件事。
            </span>
          </>
        }
        actions={
          <>
            <Link href="/review" className={buttonClass("secondary", "md")}>
            周期复习
            {stats.openMistakes + data.mastery.due > 0 ? <span className="font-mono text-[10px] text-amber">{data.mastery.due > 0 ? data.mastery.due : ""}</span> : null}
            </Link>
            <Link href="/bank" className={buttonClass("secondary", "md")}>
              题库
            </Link>
            <Link href={data.continueHref} className={buttonClass("primary", "md")}>
              继续学习
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {!profile?.onboarded ? (
        <Panel tone="accent" className="mb-4 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-medium text-paper">先把目标和等级定下来</p>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              30 秒完成设置，练习、计划和面试都会按你的等级调整。
            </p>
          </div>
          <Link href="/onboarding" className={buttonClass("primary", "sm")}>
            完成设置
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Panel>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <SectionLabel index="01">TODAY&apos;S FOCUS</SectionLabel>
                <Badge tone="outline">3 个动作</Badge>
              </div>
              <span className="font-mono text-[10px] text-muted/50">
                {dailyTasks.length} TASKS
              </span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {dailyTasks.map((task, index) => (
                <Link
                  key={`${task.href}-${index}`}
                  href={task.href}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-paper transition group-hover:text-lime">
                      {task.title}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-muted">{task.subtitle}</span>
                  </span>
                  {task.minutes ? (
                    <span className="hidden shrink-0 font-mono text-[10px] text-muted/50 sm:block">
                      {task.minutes} MIN
                    </span>
                  ) : null}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-lime" />
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
              <span className="text-[11px] text-muted">
                {sprintView
                  ? `按「${sprintView.title}」推进`
                  : "还没有急冲计划时，按目标等级推进系统学习"}
              </span>
              <Link
                href={sprintView ? `/sprint/${sprintView.id}` : "/sprint"}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-lime hover:underline"
              >
                查看计划
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </Panel>

          {sprintView ? (
            <Panel className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="lime">急冲中</Badge>
                    <span className="font-mono text-[10px] text-muted/50">
                      {sprintView.plan.days.length} DAYS · {track.shortName}
                    </span>
                  </div>
                  <h2 className="mt-3 truncate text-[17px] font-semibold text-paper">
                    {sprintView.title}
                  </h2>
                  <p className="mt-1 text-[12px] text-muted">
                    已完成 {sprintView.progress.done}/{sprintView.progress.total} 个任务
                    {sprintView.nextTask ? ` · 下一步：${sprintView.nextTask.task.title}` : " · 全部完成"}
                  </p>
                  <Progress
                    value={sprintView.progress.done}
                    total={sprintView.progress.total}
                    className="mt-4 max-w-md"
                  />
                </div>
                <Link
                  href={`/sprint/${sprintView.id}`}
                  className={buttonClass("secondary", "sm", "shrink-0")}
                >
                  打开计划
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Panel>
          ) : (
            <Panel tone="warn" className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber/10 text-amber">
                  <Zap className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-medium text-paper">有明确 JD？做一份急冲计划</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">
                    从简历与岗位要求里找缺口，生成每天能执行的知识点、题和代码任务。
                  </p>
                </div>
              </div>
              <Link href="/sprint" className={buttonClass("secondary", "sm", "shrink-0")}>
                去生成
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          )}

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <SectionLabel index="02">REVIEW QUEUE</SectionLabel>
                <Badge tone={stats.openMistakes > 0 ? "amber" : "mint"}>
                  {stats.openMistakes > 0 ? `${stats.openMistakes} 待解决` : "已清空"}
                </Badge>
              </div>
              <Link href="/practice/review" className="text-[11px] text-muted transition hover:text-paper">
                全部错题
              </Link>
            </div>
            {review.items.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {review.items.slice(0, 3).map((item) => (
                  <Link
                    key={item.question.id}
                    href="/practice/review"
                    className="group flex items-start gap-3 px-5 py-4 transition hover:bg-white/[0.025]"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber/10 font-mono text-[9px] text-amber">
                      ×{item.wrongCount}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 break-words text-[13px] leading-5 text-paper/90">
                        {item.question.prompt}
                      </span>
                      <span className="mt-1.5 block text-[10px] text-muted/60">
                        {item.trackName} · {item.chapterTitle}
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted/30 transition group-hover:text-lime" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-paper/80">没有待解决的错题</p>
                <p className="mt-1 text-[11px] text-muted">做错的题会进入这里，答对后自动标记解决。</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="03">TARGET LOCK</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">PROFILE</span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <ProgressRing
                percent={percent(data.completedAtoms, data.totalAtoms)}
                size={86}
                label="方向进度"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-lime/20 bg-lime/10 font-mono text-xs text-lime">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-paper">{track.shortName}开发</p>
                    <p className="text-[10px] text-muted">{LEVEL_LABEL[level]}路径</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-[11px] text-muted">
                  {profile?.targetCompany ? `目标 · ${profile.targetCompany}` : "目标公司未设置"}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
              <Stat label="已完成知识点" value={`${data.completedAtoms}/${data.totalAtoms}`} />
              <Stat label="连续训练" value={`${stats.streakDays} 天`} tone={stats.streakDays > 1 ? "lime" : "default"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/learn/${track.id}`} className={buttonClass("secondary", "sm", "flex-1")}>
                学习路径
              </Link>
              <Link href="/profile" className={buttonClass("ghost", "sm", "flex-1")}>
                调整目标
              </Link>
            </div>
          </Panel>

          <Panel className="grid grid-cols-2 gap-y-5 p-5">
            <Stat label="练习正确率" value={`${stats.accuracy}%`} tone={stats.accuracy >= 60 ? "lime" : "default"} hint={`${stats.quizAttempts} 次练习`} />
            <Stat label="到期复习" value={data.mastery.due} tone={data.mastery.due > 0 ? "amber" : "default"} hint="周期复习" />
            <Stat label="已掌握" value={data.mastery.mastered} tone={data.mastery.mastered > 0 ? "lime" : "default"} hint="三次复习" />
            <Stat label="训练天数" value={stats.streakDays} hint="按活动记录计算" />
            <div className="col-span-2 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[10px] text-muted/50">
              <History className="h-3 w-3" />
              数据来自真实学习与练习记录
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <SectionLabel index="04">RECENT</SectionLabel>
              <Link href="/records" className="text-[11px] text-muted transition hover:text-paper">
                全部记录
              </Link>
            </div>
            {data.recentActivities.length > 0 ? (
              <div className="divide-y divide-white/[0.05]">
                {data.recentActivities.slice(0, 5).map((activity) => {
                  const Icon = ACTIVITY_ICON[activity.type] ?? TrendingUp;
                  const href =
                    typeof activity.meta.href === "string" ? activity.meta.href : "/records";
                  return (
                    <Link
                      key={activity.id}
                      href={href}
                      className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-white/[0.025]"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/50" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[12px] leading-5 text-paper/80">
                          {activity.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-[9px] text-muted/40">
                          <TimeAgo iso={activity.createdAt} />
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-[12px] text-muted">还没有记录。完成第一节课就会出现在这里。</p>
              </div>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <SectionLabel index="05">INTERVIEWS</SectionLabel>
              <Link href="/interview" className="text-[11px] text-muted transition hover:text-paper">
                去练习
              </Link>
            </div>
            {data.interviews.length > 0 ? (
              <div className="divide-y divide-white/[0.05]">
                {data.interviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/interview/${interview.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.025]"
                  >
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-muted/50" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-paper/85">
                        {interview.title} · {LEVEL_LABEL[interview.level]}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-muted/50">
                        <TimeAgo iso={interview.createdAt} />
                      </span>
                    </span>
                    <span
                      className={
                        interview.summary
                          ? "font-mono text-sm text-lime"
                          : "font-mono text-[10px] text-muted"
                      }
                    >
                      {interview.summary ? interview.summary.average : "进行中"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-[12px] text-muted">完成一次模拟面试，看看哪里会被追问。</p>
                <Link href="/interview" className={buttonClass("ghost", "sm", "mt-3")}>
                  开始面试
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] px-4 py-3">
        <p className="flex items-center gap-2 text-[11px] text-muted/60">
          <Flame className="h-3.5 w-3.5 text-amber/70" />
          连续 {stats.streakDays} 天训练 · 正确率 {stats.accuracy}% · 待复习 {stats.openMistakes} 题
        </p>
        <Link href="/records" className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-paper">
          查看完整记录
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

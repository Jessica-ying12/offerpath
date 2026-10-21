import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Flame, MessagesSquare, Target } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
  Stat,
  TimeAgo,
} from "@/components/ui/primitives";
import { ActivityFeed } from "@/components/activity-feed";
import { requireUser } from "@/lib/auth";
import { getRecordsData } from "@/lib/services/dashboard";
import { LEVEL_LABEL } from "@/lib/content/schema";

export const metadata: Metadata = { title: "学习记录" };

export default async function RecordsPage() {
  const user = await requireUser("/records");
  const data = getRecordsData(user);
  const { stats, activities, review, interviews, plans } = data;

  return (
    <div>
      <PageHeader
        eyebrow="ACTIVITY LOG / YOUR EVIDENCE"
        title="你的训练证据。"
        description="学习、练习、错题、重做、代码、计划与面试都在这里留下记录。它不负责夸你，只负责让你看见真实进度。"
        actions={
          <Link href="/practice/review" className={buttonClass("secondary", "md")}>
            错题重做
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-5 rounded-card border border-white/[0.07] bg-ink-800/55 p-5 sm:grid-cols-4">
        <Stat label="完成微课" value={stats.lessonsCompleted} hint="所有方向累计" />
        <Stat
          label="练习正确率"
          value={`${stats.accuracy}%`}
          tone={stats.accuracy >= 60 ? "lime" : "default"}
          hint={`${stats.quizAttempts} 次提交`}
        />
        <Stat
          label="待解决错题"
          value={stats.openMistakes}
          tone={stats.openMistakes > 0 ? "amber" : "default"}
          hint="答对自动解决"
        />
        <Stat label="完成面试" value={stats.interviewsCompleted} hint={`连续 ${stats.streakDays} 天`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <ActivityFeed activities={activities} />
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="QUEUE">错题队列</SectionLabel>
              <Badge tone={stats.openMistakes > 0 ? "amber" : "mint"}>{stats.openMistakes}</Badge>
            </div>
            {review.items.length > 0 ? (
              <div className="mt-4 space-y-2">
                {review.items.slice(0, 4).map((item) => (
                  <Link
                    key={item.question.id}
                    href="/practice/review"
                    className="group block rounded-xl border border-white/[0.06] p-3 transition hover:border-amber/20 hover:bg-amber/[0.025]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-amber/60">×{item.wrongCount}</span>
                      <span className="truncate text-[9px] text-muted/40">{item.chapterTitle}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-paper/75">
                      {item.question.prompt}
                    </p>
                  </Link>
                ))}
                <Link
                  href="/practice/review"
                  className="inline-flex items-center gap-1 pt-1 text-[11px] font-medium text-lime/80 hover:text-lime"
                >
                  去重做
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-[11px] text-muted/55">
                <CheckCircle2 className="h-3.5 w-3.5 text-mint/60" />
                当前没有待解决错题。
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="PLANS">计划进度</SectionLabel>
              <Target className="h-3.5 w-3.5 text-muted/40" />
            </div>
            {plans.length > 0 ? (
              <div className="mt-4 space-y-2">
                {plans.slice(0, 4).map((plan) => (
                  <Link
                    key={plan.id}
                    href={plan.kind === "sprint" ? `/sprint/${plan.id}` : `/career/${plan.id}`}
                    className="group block rounded-xl border border-white/[0.06] p-3 transition hover:border-white/15"
                  >
                    <p className="line-clamp-2 text-[11px] font-medium leading-5 text-paper/85">
                      {plan.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-muted/40">
                        {plan.kind === "sprint" ? "急冲" : "规划"} · {LEVEL_LABEL[plan.level]}
                      </span>
                      <span className="font-mono text-[9px] text-muted/50">
                        {plan.done}/{plan.total}
                      </span>
                    </div>
                    <Progress value={plan.done} total={plan.total} className="mt-2" tone={plan.kind === "career" ? "mint" : "lime"} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] leading-5 text-muted/55">还没有计划。先做一份急冲或职业规划路线。</p>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="INTERVIEW">最近面试</SectionLabel>
              <MessagesSquare className="h-3.5 w-3.5 text-muted/40" />
            </div>
            {interviews.length > 0 ? (
              <div className="mt-4 space-y-2">
                {interviews.slice(0, 4).map((session) => (
                  <Link
                    key={session.id}
                    href={`/interview/${session.id}`}
                    className="group flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/[0.025]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] text-paper/80">{session.title}</span>
                      <span className="mt-0.5 block text-[9px] text-muted/40">
                        <TimeAgo iso={session.createdAt} />
                      </span>
                    </span>
                    <span
                      className={
                        session.summary ? "font-mono text-[11px] text-lime" : "font-mono text-[9px] text-amber"
                      }
                    >
                      {session.summary ? session.summary.average : "未完成"}
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-muted/25" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 border-0 px-0 py-6"
                icon={<MessagesSquare className="h-6 w-6" />}
                title="还没有面试"
                description="完成一场后，这里会出现分数与复盘入口。"
                action={
                  <Link href="/interview" className={buttonClass("secondary", "sm")}>
                    去面试
                  </Link>
                }
              />
            )}
          </Panel>

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] px-4 py-3 text-[10px] leading-5 text-muted/45">
            <Flame className="mt-0.5 h-3 w-3 shrink-0 text-amber/60" />
            连续训练按活动日期计算。中断一天不影响历史记录，只影响连续天数。
          </div>
        </aside>
      </div>
    </div>
  );
}

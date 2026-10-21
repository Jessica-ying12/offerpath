import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  RotateCcw,
  Target,
  TrendingDown,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
  Stat,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { listActivities } from "@/lib/db/activities";
import { getReportsData, MASTERY_LABEL } from "@/lib/services/mastery";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getAllTechSkills, getTracks } from "@/lib/content";
import { formatDate, formatDateTime, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "学习报告" };

export default async function ReportsPage() {
  const user = await requireUser("/reports");
  const db = getDb();
  const data = getReportsData(user.id);
  const activities = listActivities(db, user.id, 100);
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekly = new Map<string, number>();
  for (const activity of activities) {
    const day = activity.createdAt.slice(0, 10);
    if (day >= since) weekly.set(day, (weekly.get(day) ?? 0) + 1);
  }
  const weeklyValues = [...Array(7)].map((_, index) => {
    const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { key, label: formatDate(date.toISOString()), count: weekly.get(key) ?? 0 };
  });
  const maxWeekly = Math.max(1, ...weeklyValues.map((item) => item.count));
  const skillName = (skillId: string) => getAllTechSkills().find((skill) => skill.id === skillId)?.name ?? skillId;
  const accuracy = data.quizStats.total > 0 ? percent(data.quizStats.correct, data.quizStats.total) : 0;
  const masteredPercent = data.overview.totalTracked > 0 ? percent(data.overview.mastered, data.overview.totalTracked) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="LEARNING REPORT / EVIDENCE"
        title="不看你看了多久，看你掌握了什么。"
        description="掌握度、周期复习、练习正确率、薄弱技术与笔试记录汇总在这里。只有完成知识点、章节练习和三次复习的章节才计入“已掌握”。"
        actions={
          <>
            <Link href="/review" className={buttonClass("secondary", "md")}>
              <RotateCcw className="h-4 w-4" />
              复习队列
            </Link>
            <Link href="/exam" className={buttonClass("primary", "md")}>
              <ClipboardCheck className="h-4 w-4" />
              模拟笔试
            </Link>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-5 rounded-card border border-white/[0.07] bg-ink-800/55 p-5 sm:grid-cols-4 lg:grid-cols-5">
        <Stat label="已掌握" value={data.overview.mastered} tone="lime" hint={`${masteredPercent}% 追踪章节`} />
        <Stat label="待复习" value={data.overview.due} tone={data.overview.due > 0 ? "amber" : "default"} hint="到期需要复习" />
        <Stat label="练习正确率" value={`${accuracy}%`} hint={`${data.quizStats.attempts} 次章节练习`} />
        <Stat label="开放错题" value={data.openMistakes.length} tone={data.openMistakes.length > 0 ? "coral" : "default"} hint="答对后解决" />
        <Stat label="已掌握占比" value={`${masteredPercent}%`} hint="三次复习后" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionLabel index="WEEK">最近 7 天活动</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{weeklyValues.reduce((sum, item) => sum + item.count, 0)} EVENTS</span>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2">
              {weeklyValues.map((item) => (
                <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end justify-center">
                    <div
                      className="w-full max-w-8 rounded-t-md bg-lime/70 transition-all"
                      style={{ height: `${Math.max(4, (item.count / maxWeekly) * 100)}%` }}
                      title={`${item.count} 次活动`}
                    />
                  </div>
                  <span className="text-[8px] text-muted/40">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted/45">
              活动包含学习、练习、代码、复习、笔试和面试记录；它不是学习时长，避免用“挂机时长”制造虚假成就感。
            </p>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <SectionLabel index="MASTERY">章节掌握</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{data.overview.totalTracked} TRACKED</span>
            </div>
            {data.overview.items.length > 0 ? (
              <div className="divide-y divide-white/[0.05]">
                {data.overview.items.map((item) => (
                  <div key={item.chapterId} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[10px] text-muted">
                      <BookOpenCheck className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-paper/85">{item.chapterTitle}</p>
                      <p className="mt-0.5 font-mono text-[9px] text-muted/40">
                        {item.trackName} · {LEVEL_LABEL[item.level]} · 复习 {item.reviewCount}/3
                      </p>
                    </div>
                    <Badge
                      tone={item.stage === 5 ? "mint" : item.due ? "amber" : "outline"}
                    >
                      {item.label}
                    </Badge>
                    {item.nextReviewAt && item.stage < 5 ? (
                      <span className="font-mono text-[9px] text-muted/40">下次 {formatDate(item.nextReviewAt)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] text-paper/80">还没有章节进入掌握追踪</p>
                <p className="mt-1 text-[11px] text-muted">先学完一个章节并完成章节练习。</p>
                <Link href="/library" className={buttonClass("secondary", "sm", "mt-4")}>开始学习</Link>
              </div>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <SectionLabel index="ATTEMPTS">最近成绩</SectionLabel>
            </div>
            <div className="grid gap-0 divide-y divide-white/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-5">
                <p className="text-[10px] text-muted">周期复习</p>
                <div className="mt-2 space-y-2">
                  {data.reviewAttempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted/50">{formatDate(attempt.createdAt)}</span>
                      <span className={attempt.score / attempt.total >= 0.8 ? "text-mint" : "text-amber"}>
                        {attempt.score}/{attempt.total}
                      </span>
                    </div>
                  ))}
                  {data.reviewAttempts.length === 0 ? <p className="text-[10px] text-muted/45">暂无</p> : null}
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] text-muted">题库练习</p>
                <div className="mt-2 space-y-2">
                  {data.bankAttempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted/50">{formatDate(attempt.createdAt)}</span>
                      <span className="text-lime">{attempt.score}/{attempt.total}</span>
                    </div>
                  ))}
                  {data.bankAttempts.length === 0 ? <p className="text-[10px] text-muted/45">暂无</p> : null}
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] text-muted">模拟笔试</p>
                <div className="mt-2 space-y-2">
                  {data.examAttempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-muted/50">
                        {getTracks().find((track) => track.id === attempt.trackId)?.shortName ?? attempt.trackId}
                      </span>
                      <span className="text-paper/70">{percent(attempt.score, attempt.total)}%</span>
                    </div>
                  ))}
                  {data.examAttempts.length === 0 ? <p className="text-[10px] text-muted/45">暂无</p> : null}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="STAGES">掌握阶段</SectionLabel>
              <BarChart3 className="h-3.5 w-3.5 text-muted/40" />
            </div>
            <div className="mt-4 space-y-3">
              {([1, 2, 3, 4, 5] as const).map((stage) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{MASTERY_LABEL[stage]}</span>
                    <span className="font-mono text-muted/60">{data.overview.byStage[stage]}</span>
                  </div>
                  <Progress
                    value={data.overview.byStage[stage]}
                    total={Math.max(1, data.overview.totalTracked)}
                    tone={stage === 5 ? "mint" : "lime"}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber" />
              <p className="text-[12px] font-medium text-paper">薄弱技术</p>
            </div>
            {data.weakSkills.length > 0 ? (
              <div className="mt-3 space-y-2">
                {data.weakSkills.map((skill) => (
                  <div key={skill.skillId} className="flex items-center justify-between rounded-lg border border-amber/10 bg-amber/[0.025] px-3 py-2 text-[11px]">
                    <span className="text-paper/75">{skill.name}</span>
                    <span className="font-mono text-[10px] text-amber">×{skill.wrongCount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] leading-5 text-muted/55">当前没有未解决错题。继续保持章节练习和复习。</p>
            )}
            <Link href="/practice/review" className={buttonClass("secondary", "sm", "mt-4 w-full")}>
              去错题重做
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">下一步建议</p>
            </div>
            <ol className="mt-3 space-y-2 text-[10px] leading-5 text-muted/65">
              {data.weakSkills.length > 0 ? (
                <li>1. 先处理错题：{data.weakSkills.slice(0, 2).map((skill) => skill.name).join("、")}。</li>
              ) : (
                <li>1. 找一个未掌握章节，完成章节练习。</li>
              )}
              <li>2. {data.overview.due > 0 ? `今天先完成 ${data.overview.due} 个到期复习。` : "保持复习节奏，别把章节堆到最后。"}</li>
              <li>3. 用一次模拟笔试检查跨章节迁移。</li>
            </ol>
            <Link href="/review" className={buttonClass("primary", "sm", "mt-4 w-full")}>
              进入复习
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>

          {data.overview.items.length === 0 ? (
            <EmptyState
              icon={<Target className="h-7 w-7" />}
              title="先建立一个可衡量的学习闭环"
              description="学一个知识点 → 做章节练习 → D+1/D+3/D+7 复习，报告才有意义。"
              action={<Link href="/library" className={buttonClass("secondary", "sm")}>选择课程</Link>}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingUp,
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
import { getReviewPageData, MASTERY_LABEL } from "@/lib/services/mastery";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "周期复习" };

export default async function ReviewPage() {
  const user = await requireUser("/review");
  const data = getReviewPageData(user.id);
  const { overview } = data;

  return (
    <div>
      <PageHeader
        eyebrow="SPACED REVIEW / MASTERY"
        title={
          <>
            学完只是开始，
            <br className="sm:hidden" />
            复习三次才算掌握。
          </>
        }
        description="章节练习达到 60% 后进入周期复习：D+1、D+3、D+7 各通过一次（≥80%），才会标记为“已掌握”。复习失败次日再来，不把一次看懂当成长期记住。"
        actions={
          <Link href="/reports" className={buttonClass("secondary", "md")}>
            学习报告
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-5 rounded-card border border-white/[0.07] bg-ink-800/55 p-5 sm:grid-cols-4">
        <Stat label="今日到期" value={data.due.length} tone={data.due.length > 0 ? "amber" : "default"} hint="需要先复习" />
        <Stat label="已掌握章节" value={overview.mastered} tone={overview.mastered > 0 ? "lime" : "default"} hint="三次复习通过" />
        <Stat label="学习中" value={overview.learning} hint="知识点尚未全部完成" />
        <Stat label="追踪章节" value={overview.totalTracked} hint="进入过章节练习" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel index="DUE">今天该复习</SectionLabel>
            <span className="font-mono text-[9px] text-muted/40">{data.due.length} 个章节</span>
          </div>
          {data.due.length > 0 ? (
            data.due.map((item) => (
              <Panel key={item.chapterId} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="amber">{item.label}</Badge>
                    <span className="font-mono text-[9px] text-muted/40">
                      {item.trackName} · {LEVEL_LABEL[item.level]}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-[16px] font-semibold text-paper">{item.chapterTitle}</h2>
                  <p className="mt-1 text-[11px] text-muted">
                    {item.reviewCount} 次复习通过 · 共 {item.questionCount} 道题可选 · 需要 ≥80% 才算通过
                  </p>
                </div>
                <Link href={`/review/${item.chapterId}`} className={buttonClass("primary", "md", "shrink-0")}>
                  <RotateCcw className="h-4 w-4" />
                  开始复习
                </Link>
              </Panel>
            ))
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="今天没有到期复习"
              description="完成章节练习后，系统会自动安排 D+1 复习；也可以去技术库继续学习新章节。"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/library" className={buttonClass("primary", "sm")}>继续学习</Link>
                  <Link href="/bank" className={buttonClass("secondary", "sm")}>去题库</Link>
                </div>
              }
            />
          )}

          <div className="mt-6 flex items-center justify-between">
            <SectionLabel index="UPCOMING">未来 7 天</SectionLabel>
            <span className="font-mono text-[9px] text-muted/40">{data.upcoming.length}</span>
          </div>
          {data.upcoming.length > 0 ? (
            <div className="space-y-2">
              {data.upcoming.map((item) => (
                <Panel key={item.chapterId} className="flex items-center gap-3 p-4">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted/50" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-paper/80">{item.chapterTitle}</p>
                    <p className="mt-0.5 text-[10px] text-muted/50">
                      {item.trackName} · {item.label} · 预定 {item.nextReviewAt ? formatDate(item.nextReviewAt) : "—"}
                    </p>
                  </div>
                  <Link href={`/review/${item.chapterId}`} className="shrink-0 text-[10px] text-lime/70 hover:text-lime">
                    提前练
                  </Link>
                </Panel>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[11px] text-muted/50">
              未来 7 天没有排期。完成更多章节练习后会自动加入。
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="STAGES">掌握分布</SectionLabel>
              <TrendingUp className="h-3.5 w-3.5 text-muted/40" />
            </div>
            <div className="mt-4 space-y-3">
              {([2, 3, 4, 5] as const).map((stage) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{MASTERY_LABEL[stage]}</span>
                    <span className="font-mono text-muted/60">{overview.byStage[stage]}</span>
                  </div>
                  <Progress
                    value={overview.byStage[stage]}
                    total={Math.max(1, overview.totalTracked)}
                    tone={stage === 5 ? "mint" : "lime"}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-muted/45">
              “待复习”是已通过章节练习、等待第一次间隔复习；“已掌握”必须完成三次复习。
            </p>
          </Panel>

          <Panel tone="accent" className="p-5">
            <div className="flex items-center gap-2 text-lime">
              <Sparkles className="h-4 w-4" />
              <p className="text-[12px] font-medium">复习不是重看</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted/70">
              先合上资料回忆，再作答；答错后看解析，说明“为什么错”。只有能独立再答对，才把知识点留在长期记忆里。
            </p>
            <Link href="/bank" className={buttonClass("secondary", "sm", "mt-4 w-full")}>
              额外练一组题
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

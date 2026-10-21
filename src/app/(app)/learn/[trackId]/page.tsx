import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Layers,
  MessagesSquare,
  PenLine,
  Smartphone,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  ProgressRing,
  SectionLabel,
  TimeAgo,
} from "@/components/ui/primitives";
import { requireProfile, requireUser } from "@/lib/auth";
import { getTrack, getSkillName } from "@/lib/content";
import { LEVEL_LABEL, LEVELS, type LevelId } from "@/lib/content/schema";
import { getTrackPageData } from "@/lib/services/learning";
import { getChapterMasteryMap, MASTERY_LABEL } from "@/lib/services/mastery";
import { getDb } from "@/lib/db/client";
import { cn, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "学习路径" };

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackId: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const user = await requireUser();
  const profile = await requireProfile(user);
  const { trackId } = await params;
  const query = await searchParams;
  const track = getTrack(trackId);
  if (!track) notFound();
  const levelParam = LEVELS.includes(query.level as LevelId)
    ? (query.level as LevelId)
    : profile.trackId === track.id
      ? profile.level
      : "junior";
  const data = getTrackPageData(user.id, track.id, levelParam);
  const masteryMap = getChapterMasteryMap(user.id, track.id, getDb());
  const Icon = track.id === "mobile" ? Smartphone : Layers;
  const levelCompleted = data.levelStats.find((item) => item.level === data.level);
  const overallPercent = percent(data.overall.completed, data.overall.total);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/learn" className="transition hover:text-paper">
          系统学习
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <span className="text-paper/70">{track.name}</span>
      </div>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            {track.shortName.toUpperCase()} TRACK · 3 LEVELS
          </span>
        }
        title={track.name}
        description={track.description}
        actions={
          data.nextHref ? (
            <Link href={data.nextHref} className={buttonClass("primary", "md")}>
              继续学习
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1.5">
        {data.levelStats.map((item) => {
          const active = item.level === data.level;
          return (
            <Link
              key={item.level}
              href={`/learn/${track.id}?level=${item.level}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2.5 text-center transition",
                active ? "bg-lime text-ink-950" : "text-muted hover:bg-white/[0.04] hover:text-paper",
              )}
            >
              <span className="block text-[12px] font-semibold">{LEVEL_LABEL[item.level]}</span>
              <span
                className={cn(
                  "mt-0.5 block font-mono text-[9px]",
                  active ? "text-ink-950/60" : "text-muted/50",
                )}
              >
                {item.completed}/{item.total} 知识点
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="lime">{LEVEL_LABEL[data.level]}路径</Badge>
                <span className="font-mono text-[10px] text-muted/50">
                  {levelCompleted?.completed ?? 0}/{levelCompleted?.total ?? 9} LESSONS
                </span>
              </div>
              <p className="mt-2 max-w-xl text-[12px] leading-6 text-muted">{data.levelInfo.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.levelInfo.focus.slice(0, 3).map((focus) => (
                <span
                  key={focus}
                  className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[10px] text-muted"
                >
                  {focus}
                </span>
              ))}
            </div>
          </Panel>

          {data.chapters.map((view) => {
            const { chapter, atoms, completedAtoms, practiceAttempt, codePassed } = view;
            const firstIncomplete = atoms.find((atom) => !atom.completed) ?? atoms[0];
            const skillIds = [...new Set(atoms.flatMap((atom) => atom.skills))];
            return (
              <Panel key={chapter.id} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="mt-0.5 font-mono text-[11px] text-lime/60">
                      {String(chapter.order).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-paper">
                        {chapter.title}
                      </h2>
                      <p className="mt-1 text-[12px] leading-5 text-muted">{chapter.summary}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {skillIds.map((skillId) => (
                          <span key={skillId} className="text-[10px] text-muted/50">
                            #{getSkillName(track, skillId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                    <span className="font-mono text-[10px] text-muted/50">
                      {completedAtoms}/3 完成
                    </span>
                    {masteryMap.get(chapter.id) ? (
                      <Badge
                        tone={
                          masteryMap.get(chapter.id)!.stage === 5
                            ? "mint"
                            : masteryMap.get(chapter.id)!.nextReviewAt &&
                                masteryMap.get(chapter.id)!.nextReviewAt! <= new Date().toISOString()
                              ? "amber"
                              : "outline"
                        }
                      >
                        {MASTERY_LABEL[masteryMap.get(chapter.id)!.stage]}
                      </Badge>
                    ) : null}
                    <Link
                      href={`/learn/${track.id}/${chapter.id}/${firstIncomplete.id}`}
                      className={buttonClass("secondary", "sm")}
                    >
                      {completedAtoms > 0 ? "继续" : "开始"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {atoms.map((atom, index) => (
                    <Link
                      key={atom.id}
                      href={`/learn/${track.id}/${chapter.id}/${atom.id}`}
                      className="group flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.025]"
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]",
                          atom.completed
                            ? "border-mint/30 bg-mint/10 text-mint"
                            : "border-white/[0.1] font-mono text-muted/50",
                        )}
                      >
                        {atom.completed ? <Check className="h-3 w-3" strokeWidth={2.5} /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13px]",
                            atom.completed ? "text-muted" : "text-paper/90",
                          )}
                        >
                          {atom.title}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-muted/40">
                        <Clock3 className="h-3 w-3" />
                        {atom.minutes}M
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted/20 transition group-hover:text-lime" />
                    </Link>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
                  <Link
                    href={`/practice/chapter/${chapter.id}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-paper/80 transition hover:text-lime"
                  >
                    <PenLine className="h-3 w-3" />
                    章节练习 · 5 题
                    {practiceAttempt ? (
                      <span className="font-mono text-[10px] text-muted/50">
                        上次 {practiceAttempt.score}/{practiceAttempt.total} ·{" "}
                        <TimeAgo iso={practiceAttempt.createdAt} />
                      </span>
                    ) : null}
                  </Link>
                  <span className="hidden h-3 w-px bg-white/10 sm:block" />
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                    <Code2 className="h-3 w-3" />
                    代码题
                    {codePassed ? (
                      <span className="text-mint">已通过</span>
                    ) : (
                      <span className="text-muted/50">待练习</span>
                    )}
                  </span>
                  <span className="ml-auto font-mono text-[9px] text-muted/30">
                    {chapter.codeChallengeIds.length > 0 ? "1 CODE CHALLENGE" : ""}
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <SectionLabel index="PROGRESS">OVERALL</SectionLabel>
            <div className="mt-5 flex items-center gap-4">
              <ProgressRing percent={overallPercent} size={88} label="全方向" />
              <div>
                <p className="font-mono text-xl text-paper">
                  {data.overall.completed}
                  <span className="text-sm text-muted">/{data.overall.total}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted">已掌握知识点</p>
                <p className="mt-3 text-[10px] leading-4 text-muted/50">
                  完成知识点只代表学习过；通过章节练习与代码题才算真正闭环。
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
              {LEVELS.map((item) => {
                const stat = data.levelStats.find((candidate) => candidate.level === item);
                return (
                  <div key={item}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">{LEVEL_LABEL[item]}</span>
                      <span className="font-mono text-muted/60">
                        {stat?.completed ?? 0}/{stat?.total ?? 9}
                      </span>
                    </div>
                    <Progress
                      value={stat?.completed ?? 0}
                      total={stat?.total ?? 9}
                      tone={item === "senior" ? "mint" : "lime"}
                      className="mt-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel tone="accent" className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/10 text-lime">
              <MessagesSquare className="h-4 w-4" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-paper">学完能讲出来吗？</p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted">
              用一轮模拟面试检查表达：答错会给提示和参考回答，答好会继续追问。
            </p>
            <Link href="/interview" className={buttonClass("secondary", "sm", "mt-4 w-full")}>
              去模拟面试
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>

          <Link
            href={track.id === "mobile" ? "/learn/fullstack" : "/learn/mobile"}
            className="group flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.025]"
          >
            <div>
              <p className="text-[11px] text-muted">切换方向</p>
              <p className="mt-0.5 text-[12px] font-medium text-paper">
                {track.id === "mobile" ? "全栈开发" : "移动端开发"}
              </p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-lime" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

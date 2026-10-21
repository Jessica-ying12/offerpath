import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Boxes, Filter, Search, Sparkles } from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { getCompletedAtomIds } from "@/lib/db/learning";
import {
  getAllTechSkills,
  getDirectionCatalog,
  getSkill,
  getTechnologyCatalog,
  getTracks,
  getTrackStats,
} from "@/lib/content";
import { DIRECTION_LABEL, LEVELS, LEVEL_LABEL, type DirectionId, type LevelId } from "@/lib/content/schema";
import { cn, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "技术库" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; level?: string; tech?: string; q?: string }>;
}) {
  const user = await requireUser("/library");
  const query = await searchParams;
  const db = getDb();
  const direction = Object.keys(DIRECTION_LABEL).includes(query.direction ?? "")
    ? (query.direction as DirectionId)
    : undefined;
  const level = LEVELS.includes(query.level as LevelId) ? (query.level as LevelId) : undefined;
  const technology = query.tech;
  const keyword = (query.q ?? "").trim().toLowerCase();
  const tracks = getTracks();
  const catalog = getTechnologyCatalog();

  const filteredTracks = tracks.filter((track) => {
    if (direction && track.direction !== direction) return false;
    if (level && !track.chapters.some((chapter) => chapter.level === level)) return false;
    if (technology && !track.skills.some((skill) => skill.id === technology)) return false;
    if (keyword) {
      const haystack = [track.name, track.shortName, track.tagline, track.description, ...track.skills.map((skill) => skill.name)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  const filteredTech = catalog.filter((item) => {
    if (direction && !item.tracks.some((entry) => entry.track.direction === direction)) return false;
    if (level && !item.tracks.some((entry) => entry.levels.includes(level))) return false;
    if (technology && item.skill.id !== technology) return false;
    if (keyword && !`${item.skill.name} ${item.skill.aliases.join(" ")}`.toLowerCase().includes(keyword)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="TECH LIBRARY / CAREER × TECHNOLOGY"
        title={
          <>
            选一门技术，
            <br className="sm:hidden" />
            系统学完再算数。
          </>
        }
        description="按岗位方向或技术筛选：Java、Spring、MySQL、Redis、React、Node、Kotlin……每个技术路径都展示真实章节、练习和来源。先学一个点，再做对应的题。"
        actions={
          <Link href="/sources" className={buttonClass("secondary", "sm")}>
            <BookOpen className="h-3.5 w-3.5" />
            权威来源
          </Link>
        }
      />

      <Panel className="mb-4 p-4 sm:p-5">
        <form method="get" action="/library" className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_1.2fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">岗位方向</span>
            <select
              name="direction"
              defaultValue={direction ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-3 text-[12px] text-paper focus:border-lime/40 focus:outline-none"
            >
              <option value="">全部方向</option>
              {Object.entries(DIRECTION_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">等级</span>
            <select
              name="level"
              defaultValue={level ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-3 text-[12px] text-paper focus:border-lime/40 focus:outline-none"
            >
              <option value="">全部等级</option>
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {LEVEL_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">技术 / 关键词</span>
            <div className="flex gap-2">
              <select
                name="tech"
                defaultValue={technology ?? ""}
                className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-900 px-3 text-[12px] text-paper focus:border-lime/40 focus:outline-none"
              >
                <option value="">全部技术</option>
                {getAllTechSkills().map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <input
                name="q"
                defaultValue={query.q ?? ""}
                placeholder="搜索课程/技术"
                className="h-10 min-w-0 flex-[1.2] rounded-lg border border-white/10 bg-ink-900 px-3 text-[12px] text-paper placeholder:text-muted/40 focus:border-lime/40 focus:outline-none"
              />
            </div>
          </label>
          <button type="submit" className={buttonClass("primary", "md", "h-10")}>
            <Filter className="h-3.5 w-3.5" />
            筛选
          </button>
        </form>
        {(direction || level || technology || query.q) ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-muted/50">当前筛选：</span>
            <Link href="/library" className="text-[10px] text-lime hover:underline">
              清除全部
            </Link>
          </div>
        ) : null}
      </Panel>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel index="PATHS">技术路径</SectionLabel>
          <span className="font-mono text-[9px] text-muted/40">{filteredTech.length} 个技术</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTech.slice(0, 12).map((item) => (
            <Link
              key={item.skill.id}
              href={`/tech/${item.skill.id}`}
              className="group rounded-xl border border-white/[0.07] bg-ink-800/50 p-3.5 transition hover:border-lime/25 hover:bg-ink-800"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-medium text-paper">{item.skill.name}</span>
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-muted/30 transition group-hover:text-lime" />
              </div>
              <p className="mt-1 text-[10px] text-muted/60">
                {item.chapterCount} 章 · {item.questionCount} 题 · {item.tracks.map((entry) => entry.track.shortName).join(" / ")}
              </p>
            </Link>
          ))}
          {filteredTech.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/10 p-5 text-center text-[12px] text-muted">
              没有匹配的技术，换个筛选条件试试。
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <SectionLabel index="COURSES">课程 · {filteredTracks.length}</SectionLabel>
        <span className="font-mono text-[9px] text-muted/40">共 {catalog.reduce((sum, item) => sum + item.questionCount, 0)}+ 道练习</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTracks.map((track) => {
          const completed = getCompletedAtomIds(db, user.id, track.id).size;
          const stats = getTrackStats(track);
          return (
            <Panel key={track.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="outline">{DIRECTION_LABEL[track.direction]}</Badge>
                    <span className="font-mono text-[9px] text-muted/40">{track.shortName}</span>
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold text-paper">{track.name}</h2>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{track.tagline}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lime">
                  <Boxes className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {track.levels.map((item) => (
                  <span key={item.id} className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[10px] text-muted">
                    {LEVEL_LABEL[item.id]}
                  </span>
                ))}
                {track.skills.slice(0, 3).map((skill) => (
                  <span key={skill.id} className="rounded-full border border-lime/15 bg-lime/[0.03] px-2.5 py-1 text-[10px] text-lime/70">
                    {skill.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-muted">
                <span>{stats.chapters} 章 · {stats.atoms} 个知识点 · {stats.questions} 题 · {stats.challenges} 代码题</span>
                <span>{percent(completed, stats.atoms)}%</span>
              </div>
              <Progress value={completed} total={stats.atoms} className="mt-2" />
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/learn/${track.id}`} className={buttonClass("primary", "sm", "flex-1")}>
                  进入课程
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href={`/bank?track=${track.id}`} className={buttonClass("secondary", "sm")}>
                  练题
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>

      {filteredTracks.length === 0 ? (
        <div className="rounded-card border border-dashed border-white/10 p-10 text-center">
          <Search className="mx-auto h-6 w-6 text-muted/30" />
          <p className="mt-3 text-[13px] text-paper/80">没有匹配的课程</p>
          <p className="mt-1 text-[11px] text-muted">当前内容只展示已上线的真实课程，不提供空壳方向。</p>
          <Link href="/library" className={buttonClass("secondary", "sm", "mt-4")}>
            清除筛选
          </Link>
        </div>
      ) : null}

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] px-4 py-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime/60" />
        <p className="text-[11px] leading-5 text-muted/60">
          技术路径把所有课程中涉及该技术的章节按等级聚合，学完知识点后可直接进入该技术的题库练习。计算机基础与 AI 前沿作为独立课程开放，不假装覆盖全部岗位。
        </p>
      </div>
    </div>
  );
}

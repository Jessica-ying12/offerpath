import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  Layers,
  MessagesSquare,
  Route,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getLearnHubData } from "@/lib/services/dashboard";
import { getTrackStats } from "@/lib/content";
import { LEVEL_LABEL } from "@/lib/content/schema";

export const metadata: Metadata = { title: "系统学习" };

export default async function LearnPage() {
  const user = await requireUser("/learn");
  const data = getLearnHubData(user);
  const current = data.tracks.find((item) => item.track.id === data.profile?.trackId);

  return (
    <div>
      <PageHeader
        eyebrow="CURRICULUM / 05 COURSES"
        title={
          <>
            小步学，
            <br className="sm:hidden" />
            马上练。
          </>
        }
        description="逐知识点精讲，不靠视频。每章学完做专项练习与代码题；技术库还可以按 Java、MySQL、React 等技术筛选。"
        actions={
          current ? (
            <Link
              href={`/learn/${current.track.id}?level=${data.profile?.level ?? "junior"}`}
              className={buttonClass("primary", "md")}
            >
              继续 {current.track.shortName}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.tracks.map(({ track, completed, total, percent }) => {
          const Icon = track.id === "mobile" ? Smartphone : Layers;
          const stats = getTrackStats(track);
          const isCurrent = track.id === data.profile?.trackId;
          return (
            <Panel key={track.id} className="relative overflow-hidden p-5 sm:p-6">
              {isCurrent ? (
                <span className="absolute right-0 top-0 rounded-bl-xl border-b border-l border-lime/20 bg-lime/[0.08] px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] text-lime">
                  CURRENT TARGET
                </span>
              ) : null}
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-lime">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-paper">{track.name}</h2>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{track.tagline}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {track.levels.map((level) => (
                  <Badge key={level.id} tone={level.id === data.profile?.level && isCurrent ? "lime" : "default"}>
                    {LEVEL_LABEL[level.id]}
                  </Badge>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">方向进度</span>
                  <span className="font-mono text-paper/70">
                    {completed}/{total} · {percent}%
                  </span>
                </div>
                <Progress value={completed} total={total} className="mt-2" />
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.015] py-3">
                <div className="px-3 text-center">
                  <p className="font-mono text-[15px] text-paper">{stats.atoms}</p>
                  <p className="mt-0.5 text-[10px] text-muted">知识点</p>
                </div>
                <div className="px-3 text-center">
                  <p className="font-mono text-[15px] text-paper">{stats.questions}</p>
                  <p className="mt-0.5 text-[10px] text-muted">练习题</p>
                </div>
                <div className="px-3 text-center">
                  <p className="font-mono text-[15px] text-paper">{stats.challenges}</p>
                  <p className="mt-0.5 text-[10px] text-muted">代码题</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {track.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[10px] text-muted"
                  >
                    {skill.name}
                  </span>
                ))}
                {track.skills.length > 5 ? (
                  <span className="px-1 py-1 font-mono text-[10px] text-muted/40">
                    +{track.skills.length - 5}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={`/learn/${track.id}?level=${isCurrent ? data.profile?.level ?? "junior" : "junior"}`}
                  className={buttonClass("primary", "sm", "flex-1")}
                >
                  {percent > 0 ? "继续学习" : "开始学习"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/practice/chapter/${track.chapters[0]?.id ?? ""}`}
                  className={buttonClass("secondary", "sm")}
                  aria-label={`${track.shortName}章节练习`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/practice/review" className="group">
          <Panel className="h-full p-4 transition group-hover:border-white/15 group-hover:bg-ink-800">
            <div className="flex items-center justify-between">
              <RotateCcw className="h-4 w-4 text-amber" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-paper" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-paper">错题重做</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">答错的题集中回炉，答对自动解决。</p>
          </Panel>
        </Link>
        <Link href="/career" className="group">
          <Panel className="h-full p-4 transition group-hover:border-white/15 group-hover:bg-ink-800">
            <div className="flex items-center justify-between">
              <Route className="h-4 w-4 text-mint" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-paper" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-paper">需要一份长期路线？</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">按 4/8/12 周拆阶段目标与验收。</p>
          </Panel>
        </Link>
        <Link href="/interview" className="group">
          <Panel className="h-full p-4 transition group-hover:border-white/15 group-hover:bg-ink-800">
            <div className="flex items-center justify-between">
              <MessagesSquare className="h-4 w-4 text-lime" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-paper" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-paper">检验能不能说出来</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">项目追问 + 知识题，答错有引导。</p>
          </Panel>
        </Link>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] px-4 py-3.5">
        <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-muted/50" />
        <p className="text-[11px] leading-5 text-muted/60">
          已开放移动端、全栈、Java 后端、MySQL 与计算机基础/AI 前沿。前端、数据、测试、安全等方向按路线图逐个立项，不提供空壳课程。
        </p>
      </div>
    </div>
  );
}

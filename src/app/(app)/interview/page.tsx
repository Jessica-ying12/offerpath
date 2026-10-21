import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessagesSquare, Mic, ShieldCheck, Timer } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  SectionLabel,
  TimeAgo,
} from "@/components/ui/primitives";
import { InterviewForm } from "@/components/interview-form";
import { requireProfile, requireUser } from "@/lib/auth";
import { LEVEL_LABEL, LEVELS, TRACK_IDS, type LevelId, type TrackId } from "@/lib/content/schema";
import { getInterviewList } from "@/lib/services/interviews";
import { getSprintInterviewPrefill } from "@/lib/services/plans";
import type { InterviewMode } from "@/lib/types";

export const metadata: Metadata = { title: "模拟面试" };

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; trackId?: string; level?: string }>;
}) {
  const user = await requireUser("/interview");
  const profile = await requireProfile(user);
  const query = await searchParams;
  const prefill = query.planId ? getSprintInterviewPrefill(user.id, query.planId) : null;
  const sessions = getInterviewList(user.id);
  const queryTrack = TRACK_IDS.includes(query.trackId as TrackId) ? (query.trackId as TrackId) : null;
  const queryLevel = LEVELS.includes(query.level as LevelId) ? (query.level as LevelId) : null;

  const initialTrack = prefill?.trackId ?? queryTrack ?? profile.trackId;
  const initialLevel = prefill?.level ?? queryLevel ?? profile.level;
  const initialMode: InterviewMode = prefill?.mode ?? (profile.resumeText ? "resume" : "position");
  const initialResume = prefill?.resumeText ?? profile.resumeText;
  const initialJd = prefill?.jdText ?? profile.jdText;
  const initialCompany = prefill?.company ?? profile.targetCompany;

  return (
    <div>
      <PageHeader
        eyebrow="MOCK INTERVIEW / ADAPTIVE FOLLOW-UPS"
        title={
          <>
            让面试官先开口，
            <br className="sm:hidden" />
            你才知道哪里没讲清。
          </>
        }
        description="从简历项目和目标 JD 组题。回答后给要点反馈与参考表述；低于 50 分可带着提示再答一次，70 分以上进入更深追问。"
        actions={
          <Link href="/records" className={buttonClass("secondary", "sm")}>
            查看面试记录
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/10 text-lime">
              <Mic className="h-4 w-4" />
            </span>
            <div>
              <SectionLabel>NEW SESSION</SectionLabel>
              <p className="mt-1 text-[13px] font-medium text-paper">5 道主问题 · 约 20 分钟</p>
            </div>
            {prefill ? <Badge tone="lime" className="ml-auto">来自急冲计划</Badge> : null}
          </div>
          <InterviewForm
            initialTrack={initialTrack}
            initialLevel={initialLevel}
            initialMode={initialMode}
            initialCompany={initialCompany}
            initialResume={initialResume}
            initialJd={initialJd}
          />
        </Panel>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="HISTORY">面试记录</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{sessions.length}</span>
            </div>
            {sessions.length > 0 ? (
              <div className="mt-4 space-y-2">
                {sessions.slice(0, 6).map((session) => (
                  <Link
                    key={session.id}
                    href={`/interview/${session.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 transition hover:border-white/15 hover:bg-white/[0.025]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.035] text-muted">
                      <MessagesSquare className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-paper/90">{session.title}</span>
                      <span className="mt-0.5 block font-mono text-[9px] text-muted/40">
                        {LEVEL_LABEL[session.level]} · {session.plan.mainQuestions.length} 题 ·{" "}
                        <TimeAgo iso={session.createdAt} />
                      </span>
                    </span>
                    <span
                      className={
                        session.status === "completed"
                          ? "font-mono text-sm text-lime"
                          : "font-mono text-[9px] text-amber"
                      }
                    >
                      {session.status === "completed" ? session.summary?.average ?? "—" : "继续"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 border-0 px-0 py-6"
                icon={<Mic className="h-7 w-7" />}
                title="还没有面试记录"
                description="左侧创建第一场，完成 5 题即可得到复盘报告。"
              />
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">评分不是玄学</p>
            </div>
            <ul className="mt-3 space-y-2 text-[10px] leading-5 text-muted/65">
              <li>· 要点覆盖：你的回答是否包含该题的关键机制与取舍。</li>
              <li>· 表达完整：是否有足够的解释，而不是只给结论。</li>
              <li>· 低于 50 分：展示一条提示，允许带着反馈重答一次。</li>
              <li>· 70 分以上：面试官继续追问，检查知识迁移。</li>
            </ul>
            <div className="mt-3 flex items-start gap-1.5 border-t border-white/[0.06] pt-3 text-[9px] leading-4 text-muted/35">
              <Timer className="mt-0.5 h-2.5 w-2.5 shrink-0" />
              结果用于练习参考，不构成真实面试结论。
            </div>
          </Panel>

          <div className="rounded-xl border border-white/[0.06] px-4 py-3">
            <p className="text-[10px] text-muted/50">想让问题更贴简历？</p>
            <Link href="/profile" className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-lime/80 hover:text-lime">
              完善个人简历
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

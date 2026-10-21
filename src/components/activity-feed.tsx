"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  MessagesSquare,
  Target,
  Zap,
} from "lucide-react";
import type { Activity } from "@/lib/types";
import { TimeAgo } from "@/components/ui/primitives";
import { cn, formatDateTime } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "learn", label: "学习" },
  { id: "practice", label: "练习" },
  { id: "plan", label: "计划" },
  { id: "interview", label: "面试" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];
type GroupId = Exclude<FilterId, "all">;

const GROUP: Record<string, GroupId> = {
  lesson_completed: "learn",
  solution_viewed: "learn",
  quiz_submitted: "practice",
  code_submitted: "practice",
  mistake_resolved: "practice",
  review_completed: "practice",
  bank_practiced: "practice",
  exam_completed: "practice",
  plan_created: "plan",
  profile_updated: "plan",
  account_created: "plan",
  interview_started: "interview",
  interview_completed: "interview",
};

const ICONS = {
  learn: BookOpen,
  practice: CheckCircle2,
  plan: Target,
  interview: MessagesSquare,
} as const;

const TONE = {
  learn: "text-mint",
  practice: "text-lime",
  plan: "text-amber",
  interview: "text-lime",
} as const;

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const filtered = useMemo(
    () => (filter === "all" ? activities : activities.filter((item) => GROUP[item.type] === filter)),
    [activities, filter],
  );

  return (
    <div className="overflow-hidden rounded-card border border-white/[0.07] bg-ink-800/55">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                filter === item.id
                  ? "bg-lime text-ink-950"
                  : "text-muted hover:bg-white/[0.04] hover:text-paper",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[9px] text-muted/40">{filtered.length} EVENTS</span>
      </div>

      {filtered.length > 0 ? (
        <div className="divide-y divide-white/[0.045]">
          {filtered.map((activity) => {
            const group = GROUP[activity.type] ?? "plan";
            const Icon = ICONS[group];
            const href = typeof activity.meta.href === "string" ? activity.meta.href : null;
            const content = (
              <>
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.035]",
                    TONE[group],
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[12px] leading-5 text-paper/85">{activity.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[9px] text-muted/40">
                    <TimeAgo iso={activity.createdAt} />
                    <span className="text-muted/20">·</span>
                    <span>{formatDateTime(activity.createdAt)}</span>
                  </span>
                </span>
                {href ? (
                  <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-muted/25 transition group-hover:text-lime" />
                ) : null}
              </>
            );
            return href ? (
              <Link key={activity.id} href={href} className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.025]">
                {content}
              </Link>
            ) : (
              <div key={activity.id} className="flex items-start gap-3 px-4 py-3.5">
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <Zap className="mx-auto h-6 w-6 text-muted/30" />
          <p className="mt-3 text-[12px] text-muted">这个分类还没有记录。</p>
          <p className="mt-1 text-[10px] text-muted/45">完成一次学习或练习，就会自动出现。</p>
        </div>
      )}
    </div>
  );
}

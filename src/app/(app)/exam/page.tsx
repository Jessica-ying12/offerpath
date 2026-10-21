import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, Code2, History, ListChecks } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  SectionLabel,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { listExamAttempts } from "@/lib/db/mastery";
import { getTracks } from "@/lib/content";
import { LEVELS, LEVEL_LABEL } from "@/lib/content/schema";
import { formatDateTime, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "模拟笔试" };

export default async function ExamPage() {
  const user = await requireUser("/exam");
  const db = getDb();
  const attempts = listExamAttempts(db, user.id, 10);

  return (
    <div>
      <PageHeader
        eyebrow="WRITTEN EXAM / CROSS-CHAPTER"
        title={
          <>
            20 道混合题，
            <br className="sm:hidden" />
            看看哪里是“以为会”。
          </>
        }
        description="模拟笔试从所选课程、等级跨章节抽题，提交后给出总分、逐题解析和薄弱知识点。代码题单独练习，不计入选择题得分。"
        actions={
          <Link href="/bank" className={buttonClass("secondary", "sm")}>
            <ListChecks className="h-3.5 w-3.5" />
            按技术练题
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/10 text-lime">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div>
              <SectionLabel>START EXAM</SectionLabel>
              <p className="mt-1 text-[13px] font-medium text-paper">选择课程和等级</p>
            </div>
          </div>
          <form action="/exam/session" method="get" className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">课程</span>
              <select name="trackId" className="h-11 w-full rounded-xl border border-white/10 bg-ink-900 px-3 text-sm text-paper focus:border-lime/40 focus:outline-none">
                {getTracks().map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">等级</span>
              <select name="level" className="h-11 w-full rounded-xl border border-white/10 bg-ink-900 px-3 text-sm text-paper focus:border-lime/40 focus:outline-none">
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABEL[level]}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="flex items-center gap-2 text-[12px] text-paper">
                <Clock3 className="h-3.5 w-3.5 text-amber" />
                建议 45 分钟 · 不强制倒计时
              </div>
              <p className="mt-1.5 text-[10px] leading-5 text-muted/55">
                本版笔试是一次自测：题目需要全部作答，提交后立即判分。正式限时监考版会另立需求，不把自测伪装成正式考试。
              </p>
            </div>
            <button type="submit" className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
              开始模拟笔试
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Panel>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="HISTORY">最近笔试</SectionLabel>
              <History className="h-3.5 w-3.5 text-muted/40" />
            </div>
            {attempts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {attempts.map((attempt) => {
                  const track = getTracks().find((item) => item.id === attempt.trackId);
                  return (
                    <div key={attempt.id} className="rounded-xl border border-white/[0.06] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-paper/85">
                          {track?.shortName ?? attempt.trackId} · {LEVEL_LABEL[attempt.level]}
                        </span>
                        <span className="font-mono text-sm text-lime">
                          {percent(attempt.score, attempt.total)}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-muted/40">
                        <span>{attempt.score}/{attempt.total} 题 · {Math.round(attempt.durationSeconds / 60)} 分钟</span>
                        <span>{formatDateTime(attempt.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState className="mt-4 border-0 px-0 py-6" icon={<ClipboardCheck className="h-6 w-6" />} title="还没有笔试记录" description="完成一次，报告里就能看到各技术薄弱点。" />
            )}
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">代码题不是选择题</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              笔试结果页会给出对应章节代码题入口。全栈/后端在浏览器沙箱运行 JavaScript；SQL 和 Kotlin 使用参考实现 + 自评，不冒充自动判分。
            </p>
            <Link href="/bank" className="mt-3 inline-flex items-center gap-1 text-[11px] text-lime/80 hover:text-lime">
              先做专项练习
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

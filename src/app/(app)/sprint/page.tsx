import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, ScanSearch, ShieldCheck, Target } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
  TimeAgo,
} from "@/components/ui/primitives";
import { SprintForm } from "@/components/sprint-form";
import { requireUser } from "@/lib/auth";
import { requireProfile } from "@/lib/auth";
import { listPlanCards } from "@/lib/services/plans";
import { LEVEL_LABEL } from "@/lib/content/schema";

export const metadata: Metadata = { title: "急冲计划" };

export default async function SprintPage() {
  const user = await requireUser("/sprint");
  const profile = await requireProfile(user);
  const plans = listPlanCards(user.id, "sprint");

  return (
    <div>
      <PageHeader
        eyebrow="SPRINT / RESUME × JD"
        title={
          <>
            时间不够，
            <br className="sm:hidden" />
            就只准备会被问到的。
          </>
        }
        description="把简历和目标 JD 放进来，提取技能缺口，生成按天排布的知识点、章节练习、代码题与模拟面试任务。"
        actions={
          <Link href="/interview" className={buttonClass("secondary", "sm")}>
            直接模拟面试
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/10 text-lime">
              <ScanSearch className="h-4 w-4" />
            </span>
            <div>
              <SectionLabel>NEW SPRINT</SectionLabel>
              <p className="mt-1 text-[13px] font-medium text-paper">告诉我目标，我来裁剪范围</p>
            </div>
          </div>
          <SprintForm
            initialTrack={profile.trackId}
            initialLevel={profile.level}
            initialCompany={profile.targetCompany}
            initialResume={profile.resumeText}
            initialJd={profile.jdText}
          />
        </Panel>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="HISTORY">最近计划</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{plans.length}</span>
            </div>
            {plans.length > 0 ? (
              <div className="mt-4 space-y-2">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/sprint/${plan.id}`}
                    className="group block rounded-xl border border-white/[0.06] p-3 transition hover:border-white/15 hover:bg-white/[0.025]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-[12px] font-medium leading-5 text-paper/90">{plan.title}</p>
                      <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-muted/30 transition group-hover:text-lime" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[9px] text-muted/40">
                        {LEVEL_LABEL[plan.level]} · <TimeAgo iso={plan.createdAt} />
                      </span>
                      <span className="font-mono text-[9px] text-muted/50">
                        {plan.done}/{plan.total}
                      </span>
                    </div>
                    <Progress value={plan.done} total={plan.total} className="mt-2" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 border-0 px-0 py-6"
                icon={<Target className="h-7 w-7" />}
                title="还没有急冲计划"
                description="填左侧简历或 JD，生成第一份按天执行的任务清单。"
              />
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">匹配怎么算</p>
            </div>
            <ol className="mt-3 space-y-3">
              {[
                ["抽取技能", "用方向技能词典扫描简历与 JD 中的技术词与项目线索。"],
                ["算缺口", "优先补 JD 要求但简历无证据的技能，再补等级相关基础。"],
                ["排任务", "把相关章节的知识点、练习、代码题、面试按你的天数分配。"],
              ].map(([title, copy], index) => (
                <li key={title} className="flex gap-2.5">
                  <span className="mt-0.5 font-mono text-[9px] text-lime/60">0{index + 1}</span>
                  <div>
                    <p className="text-[11px] font-medium text-paper/85">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-5 text-muted/70">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-muted/45">
              <FileText className="mt-0.5 h-3 w-3 shrink-0" />
              结果页会展示命中证据（哪些词来自简历/JD），不是黑盒分数。
            </div>
          </Panel>

          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3">
            <div>
              <p className="text-[11px] text-muted">还没填简历？</p>
              <p className="mt-0.5 text-[10px] text-muted/50">先存到个人资料，计划和面试都能复用。</p>
            </div>
            <Link href="/profile" className="text-[11px] font-medium text-lime hover:underline">
              去填写
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

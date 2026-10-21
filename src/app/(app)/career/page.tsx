import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Route, Timer, UserRoundCheck } from "lucide-react";
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
import { CareerForm } from "@/components/career-form";
import { requireProfile, requireUser } from "@/lib/auth";
import { listPlanCards } from "@/lib/services/plans";
import { LEVEL_LABEL } from "@/lib/content/schema";

export const metadata: Metadata = { title: "职业规划" };

export default async function CareerPage() {
  const user = await requireUser("/career");
  const profile = await requireProfile(user);
  const plans = listPlanCards(user.id, "career");

  return (
    <div>
      <PageHeader
        eyebrow="CAREER / STRUCTURED PATH"
        title={
          <>
            不赶面试，
            <br className="sm:hidden" />
            就搭一条能走完的路。
          </>
        }
        description="选择方向和目标等级，粘贴感兴趣公司的 JD。把 4–12 周拆成阶段目标、章节任务与验收标准，而不是一张无限长的清单。"
        actions={
          <Link href="/interview" className={buttonClass("secondary", "sm")}>
            检验表达
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Route className="h-4 w-4" />
            </span>
            <div>
              <SectionLabel>NEW ROADMAP</SectionLabel>
              <p className="mt-1 text-[13px] font-medium text-paper">给未来 4–12 周一个结构</p>
            </div>
          </div>
          <CareerForm
            initialTrack={profile.trackId}
            initialLevel={profile.level}
            initialCompany={profile.targetCompany}
            initialJd={profile.jdText}
            hasResume={profile.resumeText.trim().length > 0}
          />
        </Panel>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="HISTORY">最近路线</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{plans.length}</span>
            </div>
            {plans.length > 0 ? (
              <div className="mt-4 space-y-2">
                {plans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/career/${plan.id}`}
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
                    <Progress value={plan.done} total={plan.total} className="mt-2" tone="mint" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 border-0 px-0 py-6"
                icon={<Compass className="h-7 w-7" />}
                title="还没有规划路线"
                description="选择方向和周期，生成第一份阶段路线。"
              />
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <UserRoundCheck className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">路线怎么搭</p>
            </div>
            <div className="mt-3 space-y-3">
              {[
                ["按等级铺地基", "目标中级也会覆盖初级核心；目标高级则补中高级断层。"],
                ["每阶段有验收", "知识点、章节练习、代码题和同等级模拟面试都有明确完成线。"],
                ["用 JD 校准", "有 JD 时优先覆盖要求技能，避免路线偏离真实岗位。"],
              ].map(([title, copy], index) => (
                <div key={title} className="flex gap-2.5">
                  <span className="mt-0.5 font-mono text-[9px] text-mint/60">0{index + 1}</span>
                  <div>
                    <p className="text-[11px] font-medium text-paper/85">{title}</p>
                    <p className="mt-0.5 text-[10px] leading-5 text-muted/70">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="NEXT">后续方向</SectionLabel>
              <Badge tone="outline">规划中</Badge>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-muted/55">
              后端、前端、数据、测试、安全将在课程与题库完成后逐步开放，不提供空壳路线。
            </p>
            <Link href="/learn" className="mt-3 inline-flex items-center gap-1 text-[11px] text-lime/80 hover:text-lime">
              先看已开放方向
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Panel>

          <div className="flex items-start gap-2 px-1 text-[10px] leading-5 text-muted/45">
            <Timer className="mt-0.5 h-3 w-3 shrink-0" />
            建议每周固定 3–4 次训练；路线按周分配，不绑定具体日期，落后一两天不需要重建计划。
          </div>
        </aside>
      </div>
    </div>
  );
}

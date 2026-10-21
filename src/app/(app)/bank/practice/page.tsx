import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { Badge, buttonClass, PageHeader } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";
import { getSkill, getTracks } from "@/lib/content";
import { LEVELS, LEVEL_LABEL, TRACK_IDS, type LevelId, type TrackId } from "@/lib/content/schema";
import { selectBankQuestions, type BankFilters } from "@/lib/services/bank";

export const metadata: Metadata = { title: "题库练习" };

export default async function BankPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; level?: string; tech?: string; difficulty?: string; count?: string }>;
}) {
  await requireUser();
  const query = await searchParams;
  const trackId = TRACK_IDS.includes(query.track as TrackId) ? (query.track as TrackId) : undefined;
  const level = LEVELS.includes(query.level as LevelId) ? (query.level as LevelId) : undefined;
  const skillId = getSkill(query.tech ?? "") ? query.tech : undefined;
  const difficulty = ["1", "2", "3"].includes(query.difficulty ?? "")
    ? (Number(query.difficulty) as 1 | 2 | 3)
    : undefined;
  const count = Math.min(30, Math.max(5, Number(query.count) || 10));
  const filters: BankFilters = { trackId, level, skillId, difficulty };
  const questions = selectBankQuestions(filters, count, 7);
  const trackName = trackId ? getTracks().find((track) => track.id === trackId)?.shortName : "全部课程";
  const techName = skillId ? getSkill(skillId)?.name : null;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] text-muted">
        <Link href="/bank" className="inline-flex items-center gap-1 transition hover:text-paper">
          <ArrowLeft className="h-3 w-3" />
          题库
        </Link>
        <span>/</span>
        <span className="text-paper/70">本次练习</span>
      </div>
      <PageHeader
        eyebrow="FILTERED PRACTICE"
        title="这一组，只练你选的范围。"
        description="提交后由服务端按题库答案统一判分；解析会指出正确项和错误项。题库练习不计入章节掌握度，掌握仍需章节练习 + 周期复习。"
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="outline">{trackName}</Badge>
            {level ? <Badge tone="outline">{LEVEL_LABEL[level]}</Badge> : null}
            {techName ? <Badge tone="lime">{techName}</Badge> : null}
            <Badge tone="outline">{questions.length} 题</Badge>
          </div>
        }
      />
      {questions.length > 0 ? (
        <QuizRunner
          questions={questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            options: question.options,
            skills: question.skills,
            level: question.level,
          }))}
          mode="bank"
          sourceId="bank"
          contextLabel={`题库练习 · ${trackName}${techName ? ` · ${techName}` : ""}`}
          backHref="/bank"
          scope={{ trackId, level, skillId, difficulty, count }}
        />
      ) : (
        <div className="rounded-card border border-dashed border-white/10 p-10 text-center">
          <ListChecks className="mx-auto h-7 w-7 text-muted/30" />
          <p className="mt-3 text-[14px] text-paper/80">这个范围暂时没有题</p>
          <p className="mt-1 text-[11px] text-muted">换一个课程/技术/等级再试。</p>
          <Link href="/bank" className={buttonClass("secondary", "sm", "mt-4")}>
            返回筛选
          </Link>
        </div>
      )}
    </div>
  );
}

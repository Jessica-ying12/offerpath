import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";
import { getExamQuestions } from "@/lib/services/bank";
import { LEVELS, LEVEL_LABEL, TRACK_IDS, type LevelId, type TrackId } from "@/lib/content/schema";

export const metadata: Metadata = { title: "模拟笔试" };

export default async function ExamSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ trackId?: string; level?: string }>;
}) {
  await requireUser();
  const query = await searchParams;
  if (!TRACK_IDS.includes(query.trackId as TrackId) || !LEVELS.includes(query.level as LevelId)) {
    notFound();
  }
  const trackId = query.trackId as TrackId;
  const level = query.level as LevelId;
  const data = getExamQuestions(trackId, level, 20);
  if (data.questions.length < 5) {
    return (
      <div className="rounded-card border border-dashed border-white/10 p-10 text-center">
        <p className="text-[14px] text-paper/80">这个课程/等级暂无可组卷的题目</p>
        <Link href="/exam" className="mt-3 inline-block text-[11px] text-lime">返回笔试入口</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] text-muted">
        <Link href="/exam" className="inline-flex items-center gap-1 transition hover:text-paper">
          <ArrowLeft className="h-3 w-3" />
          模拟笔试
        </Link>
        <span>/</span>
        <span className="text-paper/70">{data.trackName} · {LEVEL_LABEL[level]}</span>
      </div>
      <PageHeader
        eyebrow="EXAM IN PROGRESS"
        title={`${data.trackName} · ${LEVEL_LABEL[level]} 模拟笔试`}
        description={`${data.questions.length} 道跨章节选择题，需完成全部题目后提交。建议 45 分钟；本次不强制计时。解析在提交后统一展示。`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="lime">{data.questions.length} 题</Badge>
            <Badge tone="outline"><Clock3 className="h-3 w-3" />建议 45 分钟</Badge>
          </div>
        }
      />
      {data.challenge ? (
        <div className="mb-4 rounded-xl border border-white/[0.06] px-4 py-3 text-[11px] text-muted">
          本场关联代码题：<Link href={`/practice/code/${data.challenge.id}`} className="text-lime/80 hover:underline">{data.challenge.title}</Link>
          <span className="ml-2 text-muted/40">代码题不计入本场选择题分数</span>
        </div>
      ) : null}
      <QuizRunner
        questions={data.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options,
          skills: question.skills,
          level: question.level,
        }))}
        mode="exam"
        sourceId="exam"
        examTrackId={trackId}
        examLevel={level}
        contextLabel={`${data.trackName} · ${LEVEL_LABEL[level]} 模拟笔试`}
        backHref="/exam"
        challenge={data.challenge}
      />
    </div>
  );
}

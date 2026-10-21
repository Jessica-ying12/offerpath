import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, RotateCcw } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getMastery } from "@/lib/db/mastery";
import { getReviewQuestionsForChapter, MASTERY_LABEL } from "@/lib/services/mastery";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "章节复习" };

export default async function ReviewSessionPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const user = await requireUser();
  const { chapterId } = await params;
  const mastery = getMastery(getDb(), user.id, chapterId);
  if (!mastery) redirect("/review");
  if (mastery.stage >= 5) redirect("/review");
  if (mastery.stage < 2) redirect("/review");
  if (mastery.nextReviewAt && new Date(mastery.nextReviewAt) > new Date()) {
    // 允许提前复习，但不把它伪装成到期任务。
  }

  let data;
  try {
    data = getReviewQuestionsForChapter(chapterId, user.id);
  } catch {
    notFound();
  }
  const { track, chapter, questions } = data;
  const questionsForRunner = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    skills: question.skills,
    level: question.level,
  }));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/review" className="inline-flex items-center gap-1 transition hover:text-paper">
          <ArrowLeft className="h-3 w-3" />
          周期复习
        </Link>
        <span>/</span>
        <span className="text-paper/70">{chapter.title}</span>
      </div>
      <PageHeader
        eyebrow={`REVIEW · ${track.shortName} · ${LEVEL_LABEL[chapter.level]}`}
        title={chapter.title}
        description="这是间隔复习，不是重新学一遍。先凭记忆作答，再对照解析；通过率需 ≥80%。复习失败不会丢进度，明天会再次进入队列。"
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="amber">{MASTERY_LABEL[mastery.stage]}</Badge>
            <Badge tone="outline">
              <CalendarClock className="h-3 w-3" />
              {mastery.nextReviewAt ? `下次 ${formatDate(mastery.nextReviewAt)}` : "复习中"}
            </Badge>
            <Badge tone="outline">
              <RotateCcw className="h-3 w-3" />
              已通过 {mastery.reviewCount}/3
            </Badge>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <QuizRunner
          questions={questionsForRunner}
          mode="review"
          sourceId={chapter.id}
          contextLabel={`${track.shortName} · ${chapter.title} · 复习`}
          backHref="/review"
        />
        <aside className="rounded-card border border-white/[0.07] bg-ink-800/55 p-5">
          <p className="eyebrow mb-2 text-lime/70">REVIEW RULE</p>
          <h2 className="text-[15px] font-semibold text-paper">怎样算通过</h2>
          <ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted">
            <li>· 至少作答 3 题，正确率 ≥80%</li>
            <li>· 通过 1 次：下一次 +3 天</li>
            <li>· 通过 2 次：下一次 +7 天</li>
            <li>· 通过 3 次：标记已掌握</li>
            <li>· 未通过：明天再复习</li>
          </ul>
          <div className="mt-4 rounded-lg border border-white/[0.06] px-3 py-2 text-[10px] leading-5 text-muted/55">
            本页只抽 5 道题作为复习抽样，不代表整章所有题。错题仍可在题库和错题队列继续练。
          </div>
        </aside>
      </div>
    </div>
  );
}

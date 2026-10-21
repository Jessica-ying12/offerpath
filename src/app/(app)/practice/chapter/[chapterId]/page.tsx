import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
  TimeAgo,
} from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getPracticePageData } from "@/lib/services/learning";
import { AppError } from "@/lib/errors";

export const metadata: Metadata = { title: "章节练习" };

export default async function ChapterPracticePage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const user = await requireUser();
  const { chapterId } = await params;
  let data;
  try {
    data = getPracticePageData(user.id, chapterId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { track, chapter, questions, challenge, practiceAttempt } = data;
  const firstAtom = chapter.atomIds[0];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Link href="/learn" className="transition hover:text-paper">
          系统学习
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <Link href={`/learn/${track.id}?level=${chapter.level}`} className="transition hover:text-paper">
          {track.shortName}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <span className="text-paper/70">{chapter.title}</span>
      </div>

      <PageHeader
        eyebrow={
          <>
            CHAPTER PRACTICE · {LEVEL_LABEL[chapter.level]} · {questions.length} QUESTIONS
          </>
        }
        title={chapter.title}
        description="先独立作答，提交后统一看解析。错题会自动进入复习队列，重做答对即清除。"
        actions={
          <Link href={`/learn/${track.id}/${chapter.id}/${firstAtom}`} className={buttonClass("ghost", "sm")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            回顾知识点
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <QuizRunner
            questions={questions}
            sourceType="chapter"
            sourceId={chapter.id}
            contextLabel={`${track.shortName} · ${chapter.title}`}
            challenge={challenge}
            backHref={`/learn/${track.id}?level=${chapter.level}`}
            priorAttempt={practiceAttempt}
          />
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <SectionLabel index="BEFORE">本章状态</SectionLabel>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xl text-paper">
                  {data.completedAtoms}
                  <span className="text-sm text-muted">/{data.totalAtoms}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted">知识点已完成</p>
              </div>
              <Badge tone={data.completedAtoms === data.totalAtoms ? "mint" : "amber"}>
                {data.completedAtoms === data.totalAtoms ? "准备充分" : "可先补课"}
              </Badge>
            </div>
            <Progress
              value={data.completedAtoms}
              total={data.totalAtoms}
              className="mt-3"
              tone={data.completedAtoms === data.totalAtoms ? "mint" : "amber"}
            />
            <p className="mt-3 text-[11px] leading-5 text-muted">
              没学完也能练，但错题会暴露理解缝隙。做完后再回到对应知识点，效率更高。
            </p>
          </Panel>

          {challenge ? (
            <Panel className="p-5">
              <div className="flex items-center gap-2 text-lime">
                <Code2 className="h-4 w-4" />
                <p className="text-[12px] font-medium">本章代码题</p>
              </div>
              <p className="mt-2 text-[13px] font-medium text-paper">{challenge.title}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                {challenge.language === "javascript"
                  ? "浏览器沙箱内执行测试，结果自动记录。"
                  : "Kotlin 题提供参考实现与自查维度，不执行代码。"}
              </p>
              <Link href={`/practice/code/${challenge.id}`} className={buttonClass("secondary", "sm", "mt-4 w-full")}>
                打开代码题
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          ) : null}

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">练习会留下什么</p>
            </div>
            <ul className="mt-3 space-y-2.5 text-[11px] leading-5 text-muted">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-mint/70" />
                本次得分、耗时与逐题选择
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-mint/70" />
                错题次数与最后出错时间
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-mint/70" />
                重做答对后自动标记解决
              </li>
            </ul>
            {practiceAttempt ? (
              <div className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-muted/60">
                上次练习：{practiceAttempt.score}/{practiceAttempt.total} ·{" "}
                <TimeAgo iso={practiceAttempt.createdAt} />
              </div>
            ) : null}
          </Panel>

          <Link
            href="/practice/review"
            className="group flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.025]"
          >
            <span className="inline-flex items-center gap-2 text-[12px] text-muted">
              <PenLine className="h-3.5 w-3.5" />
              查看错题队列
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted/40 transition group-hover:text-lime" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

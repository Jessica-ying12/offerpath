import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock3 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { getCodePageData } from "@/lib/services/learning";
import { AppError } from "@/lib/errors";
import { CodeChallengeView } from "@/components/code-challenge";

export const metadata: Metadata = { title: "代码题" };

export default async function CodeChallengePage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const user = await requireUser();
  const { challengeId } = await params;
  let data;
  try {
    data = getCodePageData(user.id, challengeId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const { track, chapter, challenge } = data;

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
        <Link href={`/practice/chapter/${chapter.id}`} className="transition hover:text-paper">
          {chapter.title}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/40" />
        <span className="text-paper/70">代码题</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2 text-lime/80">
            CODE CHALLENGE · {LEVEL_LABEL[challenge.level]} · {track.shortName}
          </div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-paper sm:text-[34px]">
            {challenge.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
            先自己实现，再对照测试与参考。代码题不追求唯一解，关注边界与可读性。
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted/50">
          <Clock3 className="h-3 w-3" />
          约 20 分钟 · {challenge.language.toUpperCase()}
        </div>
      </div>

      <CodeChallengeView
        challenge={challenge}
        latestAttempt={data.latestAttempt}
        hasAttempt={data.hasAttempt}
        backHref={`/learn/${track.id}/${chapter.id}/${chapter.atomIds[0]}`}
        practiceHref={`/practice/chapter/${chapter.id}`}
        trackName={track.shortName}
      />
    </div>
  );
}

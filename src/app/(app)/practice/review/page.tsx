import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  SectionLabel,
  TimeAgo,
} from "@/components/ui/primitives";
import { QuizRunner } from "@/components/quiz-runner";
import { requireUser } from "@/lib/auth";
import { getReviewPageData } from "@/lib/services/learning";

export const metadata: Metadata = { title: "错题重做" };

export default async function ReviewPage() {
  const user = await requireUser("/practice/review");
  const data = getReviewPageData(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="REVIEW QUEUE / MISTAKE LOOP"
        title={
          <>
            把错过的，
            <br className="sm:hidden" />
            再做对一次。
          </>
        }
        description="这里只出现你还没有解决的错题。提交后立即看解析；答对即从队列移除，答错继续累计次数。"
        actions={
          data.items.length > 0 ? (
            <Badge tone="amber">{data.items.length} 道待解决</Badge>
          ) : (
            <Link href="/learn" className={buttonClass("secondary", "sm")}>
              去学习
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )
        }
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-9 w-9" />}
          title="错题队列已清空"
          description="做错的题会自动进入这里。现在可以继续新章节，或做一轮模拟面试检查表达。"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/learn" className={buttonClass("primary", "sm")}>
                继续学习
              </Link>
              <Link href="/interview" className={buttonClass("secondary", "sm")}>
                模拟面试
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <QuizRunner
              questions={data.questions}
              sourceType="mistake"
              sourceId="review"
              contextLabel={`错题重做 · ${data.items.length} 题`}
              backHref="/records"
              priorAttempt={null}
            />
          </div>

          <aside className="space-y-4">
            <Panel className="overflow-hidden">
              <div className="border-b border-white/[0.06] px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <SectionLabel index="QUEUE">本次错题</SectionLabel>
                  <span className="font-mono text-[10px] text-muted/50">{data.items.length}</span>
                </div>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {data.items.map((item, index) => (
                  <div key={item.question.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-muted/40">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Badge tone="coral" className="text-[9px]">
                        ×{item.wrongCount}
                      </Badge>
                      <span className="truncate text-[10px] text-muted/50">{item.chapterTitle}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-paper/80">
                      {item.question.prompt}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-muted/30">
                      <TimeAgo iso={item.lastWrongAt} />
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel tone="accent" className="p-4">
              <div className="flex items-center gap-2 text-lime">
                <RotateCcw className="h-4 w-4" />
                <p className="text-[12px] font-medium">重做规则</p>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                答对后错题自动解决；再次答错会增加错误次数并保留在队列。重做也会写进学习记录。
              </p>
            </Panel>

            <div className="flex items-start gap-2 px-1 text-[10px] leading-5 text-muted/50">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
              记忆不是一次做对，而是能稳定地再做对。
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

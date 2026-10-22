import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { DOC_MAP, QA_MAP } from "../lib/content";
import { formatDate, isDue, relativeDay } from "../lib/srs";
import { useStore } from "../lib/store";
import { MarkdownView } from "../components/MarkdownView";
import { EmptyState, PageContainer } from "../components/ui";
import { plainInline } from "../lib/text";
import type { QaItem } from "../lib/types";

type Result = { id: string; good: boolean; nextReviewAt: string | null };

export function QaSessionPage() {
  const { docId = "" } = useParams();
  const doc = DOC_MAP.get(docId);
  const bank = QA_MAP.get(docId);
  const { state, reviewQa } = useStore();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "due" ? "due" : "all";
  const startQ = searchParams.get("q");

  const queue = useMemo(() => {
    if (!bank) return [] as QaItem[];
    if (mode === "due") {
      return bank.items.filter((item) => state.qa[item.id] && isDue(state.qa[item.id]));
    }
    return bank.items;
    // The queue is intentionally fixed when the session starts; review progress must not shrink it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, mode, docId]);

  const startIndex = useMemo(() => {
    if (!startQ) return 0;
    const index = queue.findIndex((item) => item.id === startQ);
    return index >= 0 ? index : 0;
  }, [queue, startQ]);

  const [index, setIndex] = useState(startIndex);
  const [revealed, setRevealed] = useState(false);
  const [ownAnswer, setOwnAnswer] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [lastNext, setLastNext] = useState<string | null>(null);

  useEffect(() => {
    setIndex(startIndex);
    setRevealed(false);
    setOwnAnswer("");
    setResults([]);
    setLastNext(null);
  }, [docId, mode, startQ, startIndex]);

  if (!doc || !bank) {
    return (
      <PageContainer>
        <EmptyState
          title="没有找到这份问答"
          description="回到面试自测选择一份分册。"
          action={<Link to="/qa" className="btn-primary">返回自测</Link>}
        />
      </PageContainer>
    );
  }

  if (queue.length === 0) {
    return (
      <PageContainer className="max-w-3xl">
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5 text-accent" />}
          title={mode === "due" ? "今天没有到期的题" : "这份分册还没有题目"}
          description={
            mode === "due"
              ? "复习计划已经清空。可以继续精读下一篇，或做一组新的自测。"
              : "换一份分册试试。"
          }
          action={
            <div className="flex gap-2">
              <Link to={`/qa/${doc.id}`} className="btn-ghost">看问答</Link>
              <Link to="/qa" className="btn-primary">选择分册</Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  if (index >= queue.length) {
    const good = results.filter((item) => item.good).length;
    const bad = results.length - good;
    return (
      <PageContainer className="max-w-3xl">
        <div className="card overflow-hidden">
          <div className="relative border-b border-line/10 bg-accent/[0.055] px-6 py-10 text-center">
            <div className="absolute inset-0 paper-grid opacity-40" />
            <div className="relative">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="eyebrow mt-4">SESSION COMPLETE</p>
              <h1 className="mt-2 font-display text-[30px] font-bold text-ink">这组自测完成</h1>
              <p className="mt-2 text-[12px] text-muted">
                {bank.title} · 共 {results.length} 题
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line/10">
            <div className="p-4 text-center">
              <p className="font-display text-[26px] font-bold text-accent">{good}</p>
              <p className="text-[9.5px] text-muted">答上来</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-display text-[26px] font-bold text-coral">{bad}</p>
              <p className="text-[9.5px] text-muted">需再练</p>
            </div>
            <div className="p-4 text-center">
              <p className="font-display text-[26px] font-bold text-ink">{results.length}</p>
              <p className="text-[9.5px] text-muted">本轮题数</p>
            </div>
          </div>
          <div className="border-t border-line/10 px-5 py-5">
            <div className="rounded-xl bg-raised/50 p-4 text-[11px] leading-6 text-muted">
              首次自测后，题目会在 D+1 回到队列；之后每通过一次按 D+3 / D+7 继续，三次通过才标记「已掌握」；没答上来的题明天回到队列。
              复习不是重读答案，而是先遮住答案再讲一遍。
              {lastNext ? (
                <span className="mt-1 block text-accent">下一题最早复习：{relativeDay(lastNext)}（{formatDate(lastNext)}）</span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/qa/${doc.id}`} className="btn-primary">
                回到分册 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to={`/learn/${doc.id}`} className="btn-ghost">逐个学知识点</Link>
              <Link to="/review" className="btn-ghost">
                <RotateCcw className="h-3.5 w-3.5" /> 复习队列
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const item = queue[index];
  const qa = state.qa[item.id];
  const due = qa ? isDue(qa) : false;

  const rate = (good: boolean) => {
    const next = reviewQa(item.id, good);
    setResults((current) => [
      ...current,
      { id: item.id, good, nextReviewAt: next.nextReviewAt },
    ]);
    setLastNext(next.nextReviewAt);
    setIndex((current) => current + 1);
    setRevealed(false);
    setOwnAnswer("");
  };

  return (
    <PageContainer className="max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
        <Link to={`/qa/${doc.id}`} className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> {bank.title}
        </Link>
        <span className="text-line/30">/</span>
        <span>{mode === "due" ? "到期复习" : "自测"}</span>
        <span className="ml-auto font-mono">
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="progress-track mb-5">
        <div className="progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line/10 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5 text-[9.5px]">
            <span className="chip border-accent/20 bg-accent/[0.06] text-accent">
              {doc.id} · {doc.title}
            </span>
            <span className="chip">Q{item.number}</span>
            {item.followUps.length > 0 ? <span className="chip">{item.followUps.length} 层追问</span> : null}
            {due ? (
              <span className="chip border-coral/20 bg-coral/[0.04] text-coral">
                <Flame className="h-2.5 w-2.5" /> 到期
              </span>
            ) : qa?.status === "mastered" ? (
              <span className="chip border-accent/20 text-accent">已掌握</span>
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-[24px] font-bold leading-[1.35] text-ink sm:text-[28px]">
            {plainInline(item.question)}
          </h1>
          <p className="mt-2 text-[10.5px] text-muted">
            先别展开答案。用 30–60 秒在心里或输入框里讲一遍：是什么 → 为什么 → 项目里怎么用。
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {!revealed ? (
            <>
              <label className="mb-2 block text-[10.5px] font-medium text-muted">
                我的回答（可选，仅本机）
              </label>
              <textarea
                value={ownAnswer}
                onChange={(event) => setOwnAnswer(event.target.value)}
                rows={5}
                placeholder="先写关键词：结论、机制、对比、边界、项目例子…"
                className="w-full resize-y rounded-xl border border-line/10 bg-paper/50 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => setRevealed(true)} className="btn-primary">
                  <MessageSquareQuote className="h-4 w-4" /> 显示参考答案
                </button>
                <span className="text-[9.5px] text-muted/60">展开后按真实表现选择「答上来 / 没答上来」。</span>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-accent/15 bg-accent/[0.045] p-4 sm:p-5">
                <p className="eyebrow mb-2 text-accent/70">直接回答</p>
                <MarkdownView markdown={item.direct} docId={`qa-${doc.id}`} interactive={false} />
              </div>

              {item.followUps.map((follow, followIndex) => (
                <div key={followIndex} className="mt-3 rounded-xl border border-line/10 bg-paper/40 p-4 sm:p-5">
                  <p className="mb-2 text-[10.5px] font-semibold text-coral">
                    追问 {followIndex + 1}：{follow.question}
                  </p>
                  <MarkdownView markdown={follow.answer} docId={`qa-${doc.id}`} interactive={false} />
                </div>
              ))}

              {item.trap ? (
                <div className="mt-3 rounded-xl border border-coral/15 bg-coral/[0.035] p-4 sm:p-5">
                  <p className="mb-2 text-[10.5px] font-semibold text-coral">陷阱 / 加分</p>
                  <MarkdownView markdown={item.trap} docId={`qa-${doc.id}`} interactive={false} />
                </div>
              ) : null}

              <div className="mt-5 rounded-xl border border-line/10 bg-surface p-4">
                <p className="mb-3 text-[10.5px] font-medium text-muted">
                  刚才你能完整讲出结论、机制和取舍吗？
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => rate(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-coral/25 bg-coral/[0.04] px-4 py-3 text-[12px] font-medium text-coral transition hover:bg-coral/[0.08]"
                  >
                    <XCircle className="h-4 w-4" /> 没答上来 · 明天再来
                  </button>
                  <button
                    onClick={() => rate(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-accent/90"
                  >
                    <CheckCircle2 className="h-4 w-4" /> 答上来了 · 继续
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[9px] text-muted/60">
        自测不评分、不防作弊；重点是把答案遮住，用自己的话讲出来。
      </p>
    </PageContainer>
  );
}

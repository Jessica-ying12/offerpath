import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  MessageSquareQuote,
  Search,
  Sparkles,
} from "lucide-react";
import { ALL_QA, DOC_MAP, QA_BANKS_LIST, TOTAL_QA } from "../lib/content";
import { isDue } from "../lib/srs";
import { getQaBankProgress, useStore } from "../lib/store";
import { EmptyState, PageContainer, PageHeader, StatCard } from "../components/ui";

export function QaIndexPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const mastered = ALL_QA.filter((item) => state.qa[item.id]?.status === "mastered").length;
  const started = ALL_QA.filter((item) => state.qa[item.id]).length;
  const due = ALL_QA.filter((item) => state.qa[item.id] && isDue(state.qa[item.id])).length;
  const untouched = TOTAL_QA - started;
  const dueQuestions = ALL_QA.filter((item) => state.qa[item.id] && isDue(state.qa[item.id])).slice(0, 5);

  const banks = useMemo(
    () =>
      QA_BANKS_LIST.filter((bank) => {
        if (!query.trim()) return true;
        const doc = DOC_MAP.get(bank.docId);
        const haystack = `${bank.docId} ${doc?.title ?? ""} ${bank.title}`.toLowerCase();
        return query
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((token) => haystack.includes(token));
      }),
    [query],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`INTERVIEW SELF-TEST · ${TOTAL_QA} QUESTIONS`}
        title="面试自测"
        description="每道题包含：先自己回答 → 直接回答 → 两层追问 → 陷阱/加分。答上来的题按 D+1 / D+3 / D+7 回到复习队列，三次通过才算掌握。"
        actions={
          <>
            <Link to="/docs" className="btn-ghost">
              回到精读
            </Link>
            <Link
              to={dueQuestions[0] ? `/qa/${dueQuestions[0].docId}/session?mode=due` : "/qa/03"}
              className="btn-primary"
            >
              <MessageSquareQuote className="h-4 w-4" />
              {due > 0 ? `复习 ${due} 道到期` : "开始一组自测"}
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="问答总量" value={TOTAL_QA} hint="21 份原稿" icon={<MessageSquareQuote className="h-3.5 w-3.5" />} />
        <StatCard
          label="已掌握"
          value={mastered}
          hint="三次通过"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
          tone="accent"
        />
        <StatCard
          label="今日到期"
          value={due}
          hint="优先复习"
          icon={<Flame className="h-3.5 w-3.5 text-coral" />}
          tone={due > 0 ? "coral" : "default"}
        />
        <StatCard
          label="尚未自测"
          value={untouched}
          hint={`已开始 ${started} 道`}
          icon={<Sparkles className="h-3.5 w-3.5" />}
        />
      </div>

      {dueQuestions.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral/[0.045] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-coral">
              <Flame className="h-3.5 w-3.5" /> 今日先复习这些
            </p>
            <Link to="/review" className="text-[10px] text-coral/100 hover:underline">
              全部到期 →
            </Link>
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            {dueQuestions.map((item) => (
              <Link
                key={item.id}
                to={`/qa/${item.docId}/session?q=${item.id}&mode=due`}
                className="group flex items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-surface"
              >
                <span className="font-mono text-[9px] text-muted/60">Q{item.number}</span>
                <span className="line-clamp-1 flex-1 text-[11px] text-ink/105">{item.question}</span>
                <ArrowRight className="h-3 w-3 text-muted transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Q&A BANKS</p>
          <h2 className="text-[16px] font-bold text-ink">{QA_BANKS_LIST.length} 份精编分册</h2>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索分册…"
            className="input py-2 pl-9 text-[11.5px]"
          />
        </div>
      </div>

      {banks.length === 0 ? (
        <EmptyState title="没有匹配的分册" description="换一个关键词试试。" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {banks.map((bank) => {
            const doc = DOC_MAP.get(bank.docId);
            const progress = getQaBankProgress(state, bank.docId);
            return (
              <div key={bank.docId} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised font-mono text-[12px] font-semibold text-muted">
                    {bank.docId}
                  </span>
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-[13px] font-semibold text-ink">
                      {doc?.title ?? bank.title}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {bank.items.length} 题 · 追问 {bank.items.reduce((sum, item) => sum + item.followUps.length, 0)} 层
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[9.5px] text-muted">
                  <span className="inline-flex items-center gap-1 text-accent">
                    <CheckCircle2 className="h-3 w-3" /> {progress.mastered}
                  </span>
                  <span className="inline-flex items-center gap-1 text-coral">
                    <Flame className="h-3 w-3" /> {progress.due}
                  </span>
                  <span className="ml-auto">{bank.items.length - progress.mastered - progress.learning} 未开始</span>
                </div>
                <div className="progress-track mt-2 h-1">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress.mastered / bank.items.length) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/qa/${bank.docId}`}
                    className="flex-1 rounded-lg border border-line/10 py-1.5 text-center text-[10px] font-medium text-ink transition hover:border-accent/30 hover:text-accent"
                  >
                    看题与答案
                  </Link>
                  <Link
                    to={`/qa/${bank.docId}/session`}
                    className="flex-1 rounded-lg bg-ink py-1.5 text-center text-[10px] font-medium text-paper transition hover:bg-ink/90 dark:bg-lime dark:text-[#172014]"
                  >
                    开始自测
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

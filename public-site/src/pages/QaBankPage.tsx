import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Flame,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { DOC_MAP, QA_MAP } from "../lib/content";
import { formatDate, isDue } from "../lib/srs";
import { getQaBankProgress, useStore } from "../lib/store";
import { MarkdownView } from "../components/MarkdownView";
import { EmptyState, MasteryBadge, PageContainer } from "../components/ui";
import { plainInline } from "../lib/text";

type Filter = "all" | "new" | "learning" | "due" | "mastered";

export function QaBankPage() {
  const { docId = "" } = useParams();
  const doc = DOC_MAP.get(docId);
  const bank = QA_MAP.get(docId);
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const progress = getQaBankProgress(state, docId);

  const items = useMemo(() => {
    if (!bank) return [];
    return bank.items.filter((item) => {
      const qa = state.qa[item.id];
      if (filter === "new" && qa) return false;
      if (filter === "learning" && qa?.status !== "learning") return false;
      if (filter === "mastered" && qa?.status !== "mastered") return false;
      if (filter === "due" && (!qa || !isDue(qa))) return false;
      if (query.trim()) {
        const haystack = `${item.question} ${item.direct} ${item.followUps
          .map((follow) => `${follow.question} ${follow.answer}`)
          .join(" ")}`.toLowerCase();
        if (!query
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((token) => haystack.includes(token))) {
          return false;
        }
      }
      return true;
    });
  }, [bank, state.qa, filter, query]);

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

  return (
    <PageContainer>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
        <Link to="/qa" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> 面试自测
        </Link>
        <span className="text-line/30">/</span>
        <span>{bank.title}</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Q&A BANK · {bank.items.length} QUESTIONS</p>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[36px]">
            {doc.id} · {doc.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-muted">
            先自己回答，再展开对照。掌握 = 三次复习通过，答错回到 D+1。
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
            <span className="chip">已掌握 {progress.mastered}</span>
            <span className="chip text-coral">待复习 {progress.due}</span>
            <span className="chip">未开始 {progress.total - progress.mastered - progress.learning}</span>
            <Link to={`/doc/${doc.id}`} className="chip hover:border-accent/30">
              回到精读 <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={`/qa/${doc.id}/session`} className="btn-primary">
            <Play className="h-3.5 w-3.5" /> 开始自测
          </Link>
          {progress.due > 0 ? (
            <Link to={`/qa/${doc.id}/session?mode=due`} className="btn-ghost">
              <Flame className="h-3.5 w-3.5 text-coral" /> 复习 {progress.due} 道
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-line/10 bg-surface p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索问题、答案、追问…"
            className="input py-2 pl-9 text-[11.5px]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "全部"],
              ["new", "未开始"],
              ["learning", "复习中"],
              ["due", "到期"],
              ["mastered", "已掌握"],
            ] as Array<[Filter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`chip ${filter === value ? "chip-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {items.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="这个筛选下没有题目"
            description="切换到「全部」，或去自测一组新题。"
          />
        ) : (
          items.map((item) => {
            const qa = state.qa[item.id];
            return (
              <details key={item.id} className="group card overflow-hidden">
                <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden sm:p-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-raised font-mono text-[10px] font-semibold text-muted">
                    {item.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-6 text-ink">
                      {plainInline(item.question)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <MasteryBadge score={qa?.reviewCount ?? 0} status={qa?.status} />
                      {qa && qa.status !== "mastered" && isDue(qa) ? (
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[9px] text-coral">
                          到期 · {formatDate(qa.nextReviewAt)}
                        </span>
                      ) : null}
                      {item.followUps.length > 0 ? (
                        <span className="text-[9px] text-muted/70">
                          {item.followUps.length} 层追问
                        </span>
                      ) : null}
                      {item.trap ? <span className="text-[9px] text-coral/70">有陷阱提示</span> : null}
                    </span>
                  </span>
                  <span className="mt-1 flex shrink-0 items-center gap-2">
                    <Link
                      to={`/qa/${doc.id}/session?q=${item.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="hidden items-center gap-1 rounded-lg border border-line/10 px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent sm:inline-flex"
                    >
                      <Play className="h-2.5 w-2.5" /> 自测
                    </Link>
                    <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-line/10 bg-paper/40 px-4 pb-5 pt-4 sm:px-5">
                  <div className="rounded-xl border border-accent/15 bg-accent/[0.04] p-4">
                    <p className="eyebrow mb-2 text-accent/70">直接回答</p>
                    <MarkdownView markdown={item.direct} docId={`qa-${doc.id}`} interactive={false} />
                  </div>
                  {item.followUps.map((follow, index) => (
                    <div key={index} className="mt-3 rounded-xl border border-line/10 bg-surface p-4">
                      <p className="mb-2 text-[10.5px] font-semibold text-coral">
                        追问 {index + 1}：{follow.question}
                      </p>
                      <MarkdownView markdown={follow.answer} docId={`qa-${doc.id}`} interactive={false} />
                    </div>
                  ))}
                  {item.trap ? (
                    <div className="mt-3 rounded-xl border border-coral/15 bg-coral/[0.035] p-4">
                      <p className="mb-2 text-[10.5px] font-semibold text-coral">陷阱 / 加分</p>
                      <MarkdownView markdown={item.trap} docId={`qa-${doc.id}`} interactive={false} />
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link to={`/qa/${doc.id}/session?q=${item.id}`} className="btn-primary py-1.5 text-[11px]">
                      <Play className="h-3 w-3" /> 就这题自测
                    </Link>
                    <span className="text-[9px] text-muted/60">
                      先遮住答案，用自己的话说完，再展开。
                    </span>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}

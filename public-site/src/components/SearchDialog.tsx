import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, MessageSquareQuote, Search, X } from "lucide-react";
import { DOCS, TOTAL_QA } from "../lib/content";
import { search, type SearchHit } from "../lib/search";
import { useStore } from "../lib/store";

function Highlight({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-lime/50 px-0.5 text-ink">{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state } = useStore();

  const results = useMemo<SearchHit[]>(() => search(query), [query]);
  const recent = useMemo(
    () =>
      DOCS.filter((doc) => state.docs[doc.id]?.lastReadAt)
        .sort(
          (a, b) =>
            new Date(state.docs[b.id]?.lastReadAt ?? 0).getTime() -
            new Date(state.docs[a.id]?.lastReadAt ?? 0).getTime(),
        )
        .slice(0, 5),
    [state.docs],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    navigate(href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(results.length - 1, current + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    }
    if (event.key === "Enter") {
      const hit = results[active];
      if (hit) go(hit.href);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]">
      <button
        aria-label="关闭搜索"
        className="absolute inset-0 cursor-default bg-ink/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="全站搜索"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-2xl fade-up"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line/10 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索知识点、面试题、代码片段…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/60"
          />
          <button onClick={onClose} className="btn-quiet" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="p-2">
              <p className="eyebrow mb-2 px-2">最近阅读</p>
              {recent.length === 0 ? (
                <p className="px-2 pb-3 text-[12px] leading-6 text-muted">
                  还没有阅读记录。试试搜索「事件循环」「FlatList」「分包」「JSBridge」。
                </p>
              ) : (
                recent.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => go(`/doc/${doc.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-raised/60"
                  >
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{doc.title}</span>
                      <span className="block text-[11px] text-muted">{doc.layer} · {doc.week}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  </button>
                ))
              )}
              <div className="mt-3 border-t border-line/10 px-2 pt-3">
                <p className="eyebrow mb-2">搜索建议</p>
                <div className="flex flex-wrap gap-1.5">
                  {["事件循环", "FlatList", "setData", "JSBridge", "闭包", "类型体操", "首屏优化", "分包"].map(
                    (item) => (
                      <button key={item} className="chip hover:border-accent/30" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-muted">没有找到「{query}」，试试更短的关键词。</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((hit, index) => (
                <button
                  key={hit.id}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit.href)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                    index === active ? "bg-raised" : "hover:bg-raised/60"
                  }`}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    {hit.kind === "qa" ? (
                      <MessageSquareQuote className="h-3.5 w-3.5" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">
                        <Highlight text={hit.title} query={query} />
                        {hit.heading ? (
                          <span className="font-normal text-muted"> · {hit.heading}</span>
                        ) : null}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[9px] uppercase text-muted/60">
                        {hit.kind === "qa" ? "Q&A" : "DOC"}
                      </span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-[11.5px] leading-5 text-muted">
                      <Highlight text={hit.snippet} query={query} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line/10 px-4 py-2 text-[10px] text-muted/70">
          <span>全站 {DOCS.length} 篇精读 · {TOTAL_QA} 道问答</span>
          <span className="flex items-center gap-1.5">
            <span className="kbd">↑</span><span className="kbd">↓</span>选择
            <span className="kbd">↵</span>打开
            <span className="kbd">esc</span>关闭
          </span>
        </div>
      </div>
    </div>
  );
}

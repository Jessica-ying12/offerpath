import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Focus,
  ListTree,
  MessageSquareQuote,
  Minus,
  Plus,
  Printer,
} from "lucide-react";
import { DOC_MAP, QA_MAP, knowledgePointsForDoc } from "../lib/content";
import { getQaBankProgress, useStore } from "../lib/store";
import { MarkdownView } from "../components/MarkdownView";
import { Breadcrumbs, DocSwitcher, MasteryBadge, NotesPanel, Toc } from "../components/ui";
import { formatDate } from "../lib/srs";
import { docsModuleHref, moduleForDoc } from "../lib/taxonomy";

export function DocPage() {
  const { docId = "" } = useParams();
  const doc = DOC_MAP.get(docId);
  const { state, updateDocProgress, markDocComplete, setFontSize, setLineHeight } = useStore();
  const [active, setActive] = useState("");
  const [percent, setPercent] = useState(state.docs[docId]?.percent ?? 0);
  const [focus, setFocus] = useState(false);
  const [completedFlash, setCompletedFlash] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const lastSaveRef = useRef(0);
  const [searchParams] = useSearchParams();
  const targetHeading = searchParams.get("h");

  const bank = doc ? QA_MAP.get(doc.id) : null;
  const qaProgress = getQaBankProgress(state, docId);
  const progress = state.docs[docId];
  const module = doc ? moduleForDoc(doc.id) : null;
  const siblingDocs = module ? module.docs.map((id) => DOC_MAP.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)) : [];

  useEffect(() => {
    document.body.classList.toggle("reader-focus", focus);
    return () => document.body.classList.remove("reader-focus");
  }, [focus]);

  useEffect(() => {
    if (!doc) return;
    setPercent(state.docs[doc.id]?.percent ?? 0);
    setActive(doc.headings[0]?.slug ?? "");
    const target = targetHeading;
    if (target) {
      const timer = window.setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 160);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, targetHeading]);

  useEffect(() => {
    if (!doc) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const element = articleRef.current;
        if (!element) return;
        const top = element.getBoundingClientRect().top + window.scrollY - 80;
        const bottom = element.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 120;
        const nextPercent =
          bottom <= top ? 0 : Math.min(100, Math.max(0, ((window.scrollY - top) / (bottom - top)) * 100));
        setPercent(Math.round(nextPercent));

        let currentSlug = doc.headings[0]?.slug ?? "";
        for (const heading of doc.headings) {
          const node = document.getElementById(heading.slug);
          if (!node) continue;
          if (node.getBoundingClientRect().top <= 130) currentSlug = heading.slug;
          else break;
        }
        setActive(currentSlug);

        const now = Date.now();
        if (now - lastSaveRef.current > 1800) {
          lastSaveRef.current = now;
          updateDocProgress(doc.id, nextPercent, currentSlug || null);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [doc, updateDocProgress]);

  const previousRead = useMemo(
    () =>
      state.docs[docId]?.lastReadAt
        ? new Date(state.docs[docId].lastReadAt!).toLocaleString("zh-CN", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    [state.docs, docId],
  );

  if (!doc) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">没有找到这篇文档</h1>
        <Link to="/docs" className="btn-primary mt-5">
          返回文档库
        </Link>
      </div>
    );
  }

  const complete = () => {
    if (progress?.completed) return;
    markDocComplete(doc.id);
    setCompletedFlash(true);
    window.setTimeout(() => setCompletedFlash(false), 2200);
  };

  return (
    <div className="mx-auto w-full max-w-[1230px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          items={[
            { label: "总览", to: "/" },
            { label: "知识库", to: "/docs" },
            ...(module ? [{ label: module.title, to: docsModuleHref(module.id) }] : []),
            { label: `${doc.id} · ${doc.title}` },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFocus((value) => !value)}
            className={`btn-quiet hidden xl:inline-flex ${focus ? "text-accent" : ""}`}
            aria-pressed={focus}
          >
            <Focus className="h-3.5 w-3.5" /> 专注
          </button>
          <button onClick={() => window.print()} className="btn-quiet hidden sm:inline-flex">
            <Printer className="h-3.5 w-3.5" /> 打印
          </button>
        </div>
      </div>

      <Link to={`/learn/${doc.id}`} className="mb-4 flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/[0.045] px-4 py-3 transition hover:border-accent/40 sm:flex-row sm:items-center">
        <span className="flex-1 text-[10.5px] text-muted">
          <strong className="text-ink">按知识点学习</strong> · 这篇文档已拆成 {knowledgePointsForDoc(doc).length} 个独立知识点，每页只学一节。
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-accent">开始逐点学习 <ArrowRight className="h-3 w-3" /></span>
      </Link>

      <div
        className={
          focus
            ? "mx-auto max-w-[820px]"
            : "grid gap-10 xl:grid-cols-[minmax(0,1fr)_272px] xl:items-start"
        }
      >
        <article ref={articleRef} className="min-w-0">
          <header className="border-b border-line/10 pb-6">
            <div className="flex flex-wrap items-center gap-1.5">
              {module ? (
                <Link to={docsModuleHref(module.id)} className="chip border-accent/20 bg-accent/[0.06] text-accent">{module.title} →</Link>
              ) : null}
              <span className="chip">{doc.category}</span>
              <span className="chip">{doc.priority}</span>
              {progress?.completed ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">
                  <CheckCircle2 className="h-3 w-3" /> 已精读
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 font-display text-[32px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[44px]">
              {doc.id} · {doc.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted">{doc.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted/75">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> 约 {doc.minutes} 分钟
              </span>
              <span>{Math.round(doc.chars / 1000)}k 字符</span>
              <span>{doc.headings.length} 节</span>
              {bank ? (
                <span className="inline-flex items-center gap-1">
                  <MessageSquareQuote className="h-3 w-3" /> {bank.items.length} 道配套问答
                </span>
              ) : null}
              {previousRead ? <span>上次阅读 {previousRead}</span> : null}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={complete}
                className={progress?.completed ? "btn-ghost" : "btn-primary"}
              >
                {progress?.completed ? (
                  <>
                    <Check className="h-4 w-4" /> 已精读
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> 标记本篇已精读
                  </>
                )}
              </button>
              {bank ? (
                <Link
                  to={`/qa/${doc.id}/session${qaProgress.due > 0 ? "?mode=due" : ""}`}
                  className="btn-ghost"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  本篇自测 {bank.items.length} 题
                </Link>
              ) : null}
              <div className="ml-auto flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-1.5 py-1">
                <button
                  onClick={() => setFontSize(state.fontSize - 1)}
                  className="rounded p-1 text-muted hover:bg-raised hover:text-ink"
                  aria-label="缩小字号"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono text-[9px] text-muted">{state.fontSize.toFixed(1)}</span>
                <button
                  onClick={() => setFontSize(state.fontSize + 1)}
                  className="rounded p-1 text-muted hover:bg-raised hover:text-ink"
                  aria-label="放大字号"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <span className="mx-1 h-3 w-px bg-line/15" />
                <button
                  onClick={() => setLineHeight(state.lineHeight >= 2.1 ? 1.75 : state.lineHeight + 0.15)}
                  className="rounded px-1.5 py-1 font-mono text-[9px] text-muted hover:bg-raised hover:text-ink"
                  aria-label="调整行高"
                >
                  行高
                </button>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="progress-track flex-1">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-[9.5px] text-muted">{percent}%</span>
            </div>
            {completedFlash ? (
              <div className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.06] px-3 py-2 text-[10.5px] text-accent">
                已记录精读。建议现在做一组配套问答，把「看懂」变成「答得出」。
              </div>
            ) : null}
          </header>

          <details
            className="mt-5 rounded-xl border border-line/10 bg-surface px-4 py-3 xl:hidden"
            open={mobileTocOpen}
            onToggle={(event) => setMobileTocOpen((event.target as HTMLDetailsElement).open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-[11.5px] font-semibold text-ink">
              <span className="inline-flex items-center gap-1.5">
                <ListTree className="h-3.5 w-3.5 text-accent" /> 本篇目录 · {doc.headings.length} 节
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${mobileTocOpen ? "rotate-180" : ""}`} />
            </summary>
            <div className="mt-3 max-h-72 overflow-y-auto border-t border-line/10 pt-2">
              {doc.headings.map((heading) => (
                <button
                  key={heading.slug}
                  type="button"
                  className={`block w-full py-1.5 text-left text-[11px] leading-5 ${
                    heading.depth === 3 ? "pl-4" : ""
                  } ${active === heading.slug ? "font-semibold text-accent" : "text-muted"}`}
                  onClick={() => {
                    document.getElementById(heading.slug)?.scrollIntoView({ behavior: "smooth" });
                    setMobileTocOpen(false);
                  }}
                >
                  {heading.text}
                </button>
              ))}
            </div>
          </details>

          <div className="mt-7">
            <MarkdownView markdown={doc.markdown} docId={doc.id} />
          </div>

          <div className="mt-10 rounded-2xl border border-accent/20 bg-accent/[0.05] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="eyebrow text-accent/70">NEXT STEP</p>
                <p className="mt-1 text-[14px] font-semibold text-ink">
                  读完了，用 3 道问答检查是否真的会。
                </p>
                <p className="mt-1 text-[10.5px] leading-5 text-muted">
                  先自己回答，再看直接回答和追问；答上来的题会在 D+3 再回来。
                </p>
              </div>
              {bank ? (
                <Link to={`/qa/${doc.id}/session`} className="btn-primary shrink-0">
                  开始本篇自测 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>

          <DocSwitcher currentId={doc.id} />
        </article>

        {!focus ? (
          <aside className="hidden space-y-4 xl:sticky xl:top-[80px] xl:block">
            {module ? (
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-0.5">所属模块</p>
                    <Link to={docsModuleHref(module.id)} className="text-[11.5px] font-semibold text-ink hover:text-accent">{module.title}</Link>
                  </div>
                  <Link to={docsModuleHref(module.id)} className="text-[9px] text-accent">全部 →</Link>
                </div>
                <div className="mt-2.5 space-y-0.5 border-t border-line/10 pt-2">
                  {siblingDocs.map((item) => (
                    <Link
                      key={item.id}
                      to={`/doc/${item.id}`}
                      className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-[10px] transition ${item.id === doc.id ? "bg-accent/[0.06] font-semibold text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
                    >
                      <span className="font-mono text-[8px] opacity-60">{item.id}</span>
                      <span className="min-w-0 flex-1 truncate">{item.shortTitle}</span>
                      {state.docs[item.id]?.completed ? <CheckCircle2 className="h-2.5 w-2.5 text-accent" /> : null}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="card p-4">
              <Toc headings={doc.headings} active={active} />
            </div>

            {bank ? (
              <div className="rounded-2xl border border-line/10 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                    <MessageSquareQuote className="h-3.5 w-3.5 text-accent" /> 配套面试问答
                  </span>
                  <span className="font-mono text-[9px] text-muted">{bank.items.length}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-raised/60 py-2">
                    <p className="font-display text-[16px] font-bold text-ink">{qaProgress.mastered}</p>
                    <p className="text-[8.5px] text-muted">已掌握</p>
                  </div>
                  <div className="rounded-lg bg-raised/60 py-2">
                    <p className="font-display text-[16px] font-bold text-coral">{qaProgress.due}</p>
                    <p className="text-[8.5px] text-muted">待复习</p>
                  </div>
                </div>
                <Link
                  to={`/qa/${doc.id}`}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-line/10 py-2 text-[10.5px] font-medium text-ink transition hover:border-accent/30 hover:text-accent"
                >
                  查看全部问答 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}

            <NotesPanel docId={doc.id} />

            <div className="rounded-xl border border-line/10 bg-raised/40 p-3.5">
              <p className="text-[9px] leading-5 text-muted/70">
                内容来自你的深度学习包原稿。平台增加全文搜索、目录、清单保存、笔记、问答自测与
                D+1/D+3/D+7 复习，不替代原始文档。
              </p>
            </div>
          </aside>
        ) : null}
      </div>

      <div className="mx-auto mt-10 max-w-[820px] xl:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line/10 bg-surface p-4">
            <p className="eyebrow mb-2">配套问答</p>
            <p className="text-[12px] font-semibold text-ink">
              {qaProgress.total} 题 · 已掌握 {qaProgress.mastered}
            </p>
            <Link
              to={bank ? `/qa/${doc.id}/session` : "/qa"}
              className="mt-3 inline-flex items-center gap-1 text-[10.5px] text-accent"
            >
              去自测 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-line/10 bg-surface p-4">
            <p className="eyebrow mb-2">本篇状态</p>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink">
              <MasteryBadge score={qaProgress.mastered >= 3 ? 3 : qaProgress.mastered > 0 ? 1 : 0} />
              <span>{progress?.completed ? `精读于 ${formatDate(progress.completedAt)}` : "尚未标记精读"}</span>
            </p>
            <button onClick={complete} className="mt-3 text-[10.5px] text-accent">
              {progress?.completed ? "已精读 ✓" : "标记已精读"}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <NotesPanel docId={doc.id} />
        </div>
        <div className="mt-3 rounded-xl border border-line/10 bg-raised/40 p-3.5">
          <p className="text-[9px] leading-5 text-muted/70">
            内容来自你的深度学习包原稿；平台增加检索、清单、笔记、自测与周期复习。
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  MessageSquareQuote,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { DOCS, QA_MAP } from "../lib/content";
import { analyzeJd } from "../lib/jd";
import type { DocHeading, DocMeta } from "../lib/types";
import { useStore } from "../lib/store";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="font-display text-[30px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[38px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-[12.5px] leading-6 text-muted sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 52,
  stroke = 4,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-all duration-500"
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold text-ink">
        {label ?? `${Math.round(percent)}%`}
      </span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "accent" | "coral";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent/20 bg-accent/[0.055]"
      : tone === "coral"
        ? "border-coral/20 bg-coral/[0.045]"
        : "border-line/10 bg-surface";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between text-muted">
        <span className="text-[10.5px] font-medium">{label}</span>
        {icon ?? null}
      </div>
      <div className="mt-2 font-display text-[26px] font-bold leading-none text-ink">{value}</div>
      {hint ? <div className="mt-2 text-[10px] leading-4 text-muted/75">{hint}</div> : null}
    </div>
  );
}

export function DocCard({
  doc,
  showMatch = false,
  compact = false,
}: {
  doc: DocMeta;
  showMatch?: boolean;
  compact?: boolean;
}) {
  const { state } = useStore();
  const progress = state.docs[doc.id];
  const qa = QA_MAP.get(doc.id);
  const qaProgress = qa?.items.filter((item) => state.qa[item.id]?.status === "mastered").length ?? 0;
  const jdMatch = showMatch && state.jd ? analyzeJd(state.jd).docIds.includes(doc.id) : false;

  return (
    <Link
      to={`/doc/${doc.id}`}
      className="group flex flex-col rounded-2xl border border-line/10 bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-accent/30 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised font-mono text-[12px] font-semibold text-muted group-hover:bg-accent/10 group-hover:text-accent">
          {doc.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">{doc.title}</h3>
            {jdMatch ? (
              <span className="shrink-0 rounded-full bg-lime/25 px-1.5 py-0.5 text-[8.5px] font-semibold text-ink">
                JD
              </span>
            ) : null}
          </div>
          {!compact ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{doc.description}</p>
          ) : null}
        </div>
        {progress?.completed ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-line/30" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="chip">{doc.layer}</span>
        <span className="chip">{doc.priority}</span>
        <span className="chip">{doc.week}</span>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-3 text-[10px] text-muted/70">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {doc.minutes} 分钟
          </span>
          {qa ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquareQuote className="h-3 w-3" /> {qa.items.length} 问答
            </span>
          ) : null}
          {progress?.percent ? <span className="ml-auto font-mono">{progress.percent}%</span> : null}
        </div>
        <div className="progress-track mt-2 h-1">
          <div className="progress-fill" style={{ width: `${progress?.percent ?? 0}%` }} />
        </div>
        {qa ? (
          <div className="mt-2 flex items-center justify-between text-[9px] text-muted/60">
            <span>问答掌握 {qaProgress}/{qa.items.length}</span>
            <span className="inline-flex items-center gap-0.5 text-accent opacity-0 transition group-hover:opacity-100">
              打开 <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function Toc({
  headings,
  active,
}: {
  headings: DocHeading[];
  active: string;
}) {
  if (headings.length === 0) return null;
  return (
    <nav aria-label="本页目录" className="max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
      <p className="eyebrow mb-2.5">本页目录</p>
      <div className="space-y-0.5 border-l border-line/10">
        {headings.map((heading) => (
          <button
            key={heading.slug}
            type="button"
            onClick={() => document.getElementById(heading.slug)?.scrollIntoView({ behavior: "smooth" })}
            className={`block w-full border-l-2 py-1.5 text-left text-[11px] leading-5 transition ${
              heading.depth === 3 ? "pl-5" : "pl-3"
            } ${
              active === heading.slug
                ? "-ml-px border-accent font-semibold text-accent"
                : "-ml-px border-transparent text-muted hover:text-ink"
            }`}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function NotesPanel({ docId }: { docId: string }) {
  const { state, saveNote } = useStore();
  const [value, setValue] = useState(state.notes[docId] ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(state.notes[docId] ?? "");
    setSaved(false);
  }, [docId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (value !== (state.notes[docId] ?? "")) {
        saveNote(docId, value);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1500);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [value, docId]);

  return (
    <div className="rounded-2xl border border-line/10 bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
          <NotebookPen className="h-3.5 w-3.5 text-accent" /> 我的笔记
        </span>
        <span className="text-[9px] text-muted/60">{saved ? "已保存" : "自动保存"}</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={5}
        placeholder="用自己的话写一句结论、一个坑，或项目里的对应场景…"
        className="w-full resize-y rounded-xl border border-line/10 bg-paper/60 px-3 py-2.5 text-[11.5px] leading-5 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line/20 bg-surface/40 px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-raised text-muted">
        {icon ?? <Sparkles className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-[11.5px] leading-5 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MasteryBadge({ score, status }: { score: number; status?: "new" | "learning" | "mastered" }) {
  const tone =
    score >= 3
      ? "border-accent/25 bg-accent/10 text-accent"
      : score > 0
        ? "border-coral/20 bg-coral/[0.06] text-coral"
        : "border-line/10 bg-raised/60 text-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tone}`}>
      {status === "mastered" || score >= 3
        ? "已掌握"
        : status === "learning" || score > 0
          ? `复习中 ${score}/3`
          : "未自测"}
    </span>
  );
}

export function DocSwitcher({ currentId }: { currentId: string }) {
  const sorted = useMemo(() => DOCS, []);
  const index = sorted.findIndex((doc) => doc.id === currentId);
  const previous = index > 0 ? sorted[index - 1] : null;
  const next = index < sorted.length - 1 ? sorted[index + 1] : null;
  return (
    <div className="mt-12 grid gap-3 border-t border-line/10 pt-6 sm:grid-cols-2">
      {previous ? (
        <Link
          to={`/doc/${previous.id}`}
          className="group rounded-xl border border-line/10 bg-surface p-4 transition hover:border-accent/30"
        >
          <span className="text-[10px] text-muted">上一篇</span>
          <span className="mt-1 block text-[12.5px] font-semibold group-hover:text-accent">
            {previous.id} · {previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={`/doc/${next.id}`}
          className="group rounded-xl border border-line/10 bg-surface p-4 text-right transition hover:border-accent/30"
        >
          <span className="text-[10px] text-muted">下一篇</span>
          <span className="mt-1 block text-[12.5px] font-semibold group-hover:text-accent">
            {next.id} · {next.title}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function DocIcon() {
  return <BookOpen className="h-4 w-4" />;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Filter,
  Layers3,
  ListChecks,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { DOCS, DOC_MAP } from "../lib/content";
import { plainInline } from "../lib/text";
import {
  TYPE_COLOR,
  TYPE_DESC,
  TYPE_LABEL,
  TYPE_ORDER,
  checkFill,
  checkMultiple,
  checkSingle,
  displayQuestionType,
  extractTerms,
  gradeShort,
  loadBank,
  type BankData,
  type BankQuestion,
  type BankType,
} from "../lib/question-bank";
import { useStore } from "../lib/store";
import { MarkdownView } from "../components/MarkdownView";
import { EmptyState, PageContainer, PageHeader, StatCard } from "../components/ui";
import meta from "../data/question-meta.json";

type Tab = "doc" | "type" | "course" | "mistake";
type View = "setup" | "practice" | "result";

type Result = {
  question: BankQuestion;
  answerLabel: string;
  correct: boolean | null;
  grade?: ReturnType<typeof gradeShort>;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

type DocStat = { total: number; types: Partial<Record<BankType, number>> };

function statForDoc(stats: Record<string, DocStat>, docId: string): DocStat {
  return stats[docId] ?? { total: 0, types: {} };
}

export function BankPage() {
  const { state, recordQuiz } = useStore();
  const [bank, setBank] = useState<BankData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("doc");
  const [docId, setDocId] = useState<string>("all");
  const [types, setTypes] = useState<BankType[]>(["short", "fill", "boolean", "multiple", "single"]);
  const [includeFollow, setIncludeFollow] = useState(false);
  const [amount, setAmount] = useState(10);
  const [course, setCourse] = useState("all");
  const [view, setView] = useState<View>("setup");
  const [session, setSession] = useState<BankQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | number[] | boolean | string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [startingScroll, setStartingScroll] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadBank()
      .then((data) => {
        setBank(data);
        const queryDoc = searchParams.get("doc");
        const queryTypes = searchParams.get("types");
        if (queryDoc && DOC_MAP.has(queryDoc)) {
          setDocId(queryDoc);
          setTab("doc");
        }
        if (queryTypes) {
          const valid = queryTypes
            .split(",")
            .filter((item): item is BankType => TYPE_ORDER.includes(item as BankType));
          if (valid.length) setTypes(valid);
        }
        if (searchParams.get("tab") === "course") {
          setTab("course");
          const queryCourse = searchParams.get("course");
          if (queryCourse) setCourse(queryCourse);
        }
      })
      .catch(() => setLoadError("题库加载失败，请刷新重试。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDoc = docId === "all" ? null : DOC_MAP.get(docId);
  const mistakes = new Set(Object.keys(state.quizMistakes));

  const docStats = useMemo(() => {
    const stats: Record<string, DocStat> = {};
    if (!bank) return stats;
    for (const doc of DOCS) stats[doc.id] = { total: 0, types: {} };
    for (const question of bank.questions) {
      if (!question.docId || !stats[question.docId]) continue;
      if (question.stage === "followup" && !includeFollow) continue;
      stats[question.docId].total += 1;
      stats[question.docId].types[question.type] = (stats[question.docId].types[question.type] ?? 0) + 1;
    }
    return stats;
  }, [bank, includeFollow]);

  const docTypeCounts = useMemo(() => {
    const result = Object.fromEntries(TYPE_ORDER.map((type) => [type, 0])) as Record<BankType, number>;
    if (docId === "all") {
      for (const stat of Object.values(docStats)) {
        for (const [type, count] of Object.entries(stat.types)) result[type as BankType] += count ?? 0;
      }
    } else {
      const stat = statForDoc(docStats, docId);
      for (const [type, count] of Object.entries(stat.types)) result[type as BankType] += count ?? 0;
    }
    return result;
  }, [docId, docStats]);

  const toggleType = (type: BankType) => {
    // Deliberately local state only: filter selection must not navigate or scroll the page.
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const startSession = (pool: BankQuestion[], label = "本次练习") => {
    if (!bank || pool.length === 0) return;
    const picked = shuffle(pool).slice(0, Math.min(amount, pool.length));
    setStartingScroll(window.scrollY);
    setSession(picked);
    setIndex(0);
    setAnswer(null);
    setSubmitted(false);
    setResults([]);
    setView("practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void label;
  };

  const buildPool = () => {
    if (!bank) return [];
    return bank.questions.filter((question) => {
      if (!types.includes(question.type)) return false;
      if (question.type === "short" && question.stage === "followup" && !includeFollow) return false;
      if (docId !== "all" && question.docId !== docId) return false;
      if (tab === "course") {
        if (question.stage !== "course") return false;
        if (course !== "all" && question.courseId !== course) return false;
      } else if (question.stage === "course") {
        return false;
      }
      return true;
    });
  };

  const startFromSetup = () => {
    const pool = buildPool();
    if (pool.length === 0) return;
    startSession(pool);
  };

  const startMistakes = () => {
    if (!bank) return;
    startSession(
      bank.questions.filter((question) => mistakes.has(question.id)),
      "错题重练",
    );
  };

  const current = session[index];

  const answerLabel = (question: BankQuestion, value: typeof answer): string => {
    if (value === null || value === undefined) return "未作答";
    if (question.type === "single" && typeof value === "number") return plainInline(question.options?.[value] ?? "未作答");
    if (question.type === "multiple" && Array.isArray(value)) {
      return value.map((item) => plainInline(question.options?.[item] ?? "")).filter(Boolean).join("；") || "未作答";
    }
    if (question.type === "boolean" && typeof value === "boolean") return value ? "正确" : "错误";
    if (typeof value === "string") return value.trim() || "未作答";
    return "未作答";
  };

  const submitAnswer = () => {
    if (!current || answer === null) return;
    setSubmitted(true);
  };

  const correctForCurrent = (): boolean | null => {
    if (!current) return null;
    if (current.type === "single") return checkSingle(current, answer as number);
    if (current.type === "multiple") return checkMultiple(current, (answer as number[]) ?? []).correct;
    if (current.type === "boolean") return answer === current.answer;
    if (current.type === "fill") return checkFill(current, String(answer ?? ""));
    return null;
  };

  const appendResult = (correct: boolean | null) => {
    if (!current) return;
    const grade = current.type === "short" ? gradeShort(current, String(answer ?? "")) : undefined;
    const result: Result = {
      question: current,
      answerLabel: answerLabel(current, answer),
      correct,
      grade,
    };
    const nextResults = [...results, result];
    setResults(nextResults);
    if (index + 1 >= session.length) {
      const wrong = nextResults.filter((item) => item.correct === false);
      recordQuiz(
        {
          courseName: docId === "all" ? "知识点题库" : selectedDoc?.title ?? "知识点题库",
          level: "混合题型",
          score: nextResults.filter((item) => item.correct !== false).length,
          total: nextResults.length,
        },
        wrong.map((item) => item.question.id),
        nextResults.filter((item) => item.correct === true).map((item) => item.question.id),
      );
      setView("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIndex((value) => value + 1);
      setAnswer(null);
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const leavePractice = () => {
    setView("setup");
    setSession([]);
    setResults([]);
    setAnswer(null);
    setSubmitted(false);
    window.setTimeout(() => window.scrollTo({ top: startingScroll, behavior: "instant" as ScrollBehavior }), 30);
  };

  if (loadError) {
    return (
      <PageContainer>
        <EmptyState title="题库加载失败" description={loadError} action={<button onClick={() => window.location.reload()} className="btn-primary">刷新</button>} />
      </PageContainer>
    );
  }

  if (!bank) {
    return (
      <PageContainer>
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line/20 border-t-accent" />
          <p className="mt-4 text-[12px] text-muted">正在加载 {meta.total} 道题…</p>
        </div>
      </PageContainer>
    );
  }

  if (view === "practice" && current) {
    const isSubmitted = submitted;
    const correct = isSubmitted ? correctForCurrent() : null;
    const shortGrade = current.type === "short" ? gradeShort(current, String(answer ?? "")) : null;
    return (
      <PageContainer className="max-w-3xl">
        <div ref={topRef} />
        <div className="mb-5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
          <button onClick={leavePractice} className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft className="h-3 w-3" /> 返回题库
          </button>
          <span className="text-line/30">/</span>
          <span>{docId === "all" ? "混合知识点" : selectedDoc?.title}</span>
          <span className="ml-auto font-mono">{index + 1} / {session.length}</span>
        </div>
        <div className="progress-track mb-5">
          <div className="progress-fill" style={{ width: `${(index / session.length) * 100}%` }} />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`chip border ${TYPE_COLOR[current.type]}`}>{displayQuestionType(current)}</span>
              {current.courseName ? <span className="chip">{current.courseName}</span> : null}
              {current.docId ? (
                <Link to={`/doc/${current.docId}`} className="chip hover:border-accent/30">
                  <BookOpen className="h-2.5 w-2.5" /> {current.docTitle}
                </Link>
              ) : null}
              <span className="ml-auto font-mono text-[9px] text-muted/60">{current.section}</span>
            </div>
            <h1 className="mt-4 text-[17px] font-semibold leading-7 text-ink sm:text-[19px]">{plainInline(current.prompt)}</h1>
            {current.type === "short" ? (
              <p className="mt-2 text-[10.5px] text-muted">
                先自己写。提交后会按关键点自动对照，并展示完整参考答案；这不是人工评分。
              </p>
            ) : null}
          </div>

          <div className="p-5 sm:p-6">
            {current.type === "single" ? (
              <div className="space-y-2.5">
                {(current.options ?? []).map((option, optionIndex) => {
                  const selected = answer === optionIndex;
                  const show = isSubmitted;
                  const isRight = optionIndex === current.answerIndex;
                  return (
                    <button
                      key={optionIndex}
                      disabled={isSubmitted}
                      onClick={() => setAnswer(optionIndex)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[12.5px] leading-6 transition ${
                        show
                          ? isRight
                            ? "border-accent/40 bg-accent/[0.06]"
                            : selected
                              ? "border-coral/35 bg-coral/[0.04]"
                              : "border-line/10"
                          : selected
                            ? "border-accent/40 bg-accent/[0.05]"
                            : "border-line/10 bg-surface hover:border-accent/30"
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line/20 font-mono text-[9px]">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1">{plainInline(option)}</span>
                      {show && isRight ? <CheckCircle2 className="h-4 w-4 text-accent" /> : null}
                      {show && selected && !isRight ? <XCircle className="h-4 w-4 text-coral" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {current.type === "multiple" ? (
              <div className="space-y-2.5">
                {(current.options ?? []).map((option, optionIndex) => {
                  const selected = Array.isArray(answer) && answer.includes(optionIndex);
                  const isRight = (current.answerIndices ?? []).includes(optionIndex);
                  const show = isSubmitted;
                  return (
                    <button
                      key={optionIndex}
                      disabled={isSubmitted}
                      onClick={() => {
                        const currentAnswer = Array.isArray(answer) ? answer : [];
                        setAnswer(
                          selected
                            ? currentAnswer.filter((item) => item !== optionIndex)
                            : [...currentAnswer, optionIndex],
                        );
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[12.5px] leading-6 transition ${
                        show
                          ? isRight
                            ? "border-accent/40 bg-accent/[0.06]"
                            : selected
                              ? "border-coral/35 bg-coral/[0.04]"
                              : "border-line/10"
                          : selected
                            ? "border-accent/40 bg-accent/[0.05]"
                            : "border-line/10 bg-surface hover:border-accent/30"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[9px] ${selected ? "border-accent bg-accent text-white" : "border-line/20"}`}>
                        {selected ? "✓" : ""}
                      </span>
                      <span className="flex-1">{plainInline(option)}</span>
                      {show && isRight ? <CheckCircle2 className="h-4 w-4 text-accent" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {current.type === "boolean" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {[true, false].map((value) => {
                  const selected = answer === value;
                  const show = isSubmitted;
                  const isRight = current.answer === value;
                  return (
                    <button
                      key={String(value)}
                      disabled={isSubmitted}
                      onClick={() => setAnswer(value)}
                      className={`rounded-xl border px-4 py-4 text-[13px] font-medium transition ${
                        show
                          ? isRight
                            ? "border-accent/40 bg-accent/[0.06] text-accent"
                            : selected
                              ? "border-coral/35 bg-coral/[0.04] text-coral"
                              : "border-line/10 text-muted"
                          : selected
                            ? "border-accent/40 bg-accent/[0.05] text-accent"
                            : "border-line/10 text-muted hover:border-accent/30"
                      }`}
                    >
                      {value ? "正确" : "错误"}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {current.type === "fill" ? (
              <div>
                <input
                  value={typeof answer === "string" ? answer : ""}
                  onChange={(event) => setAnswer(event.target.value)}
                  disabled={isSubmitted}
                  placeholder="输入缺失的关键术语"
                  className="input text-[14px]"
                  autoFocus
                />
                <p className="mt-2 text-[9.5px] text-muted/60">只需填一个术语，不需要写整句。</p>
              </div>
            ) : null}

            {current.type === "short" ? (
              <textarea
                value={typeof answer === "string" ? answer : ""}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={isSubmitted}
                rows={6}
                placeholder="用自己的话回答：结论 → 机制 → 对比/边界 → 项目场景。"
                className="w-full resize-y rounded-xl border border-line/10 bg-paper/45 px-3.5 py-3 text-[12.5px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
              />
            ) : null}

            {!isSubmitted ? (
              <button
                onClick={submitAnswer}
                disabled={answer === null || (typeof answer === "string" && !answer.trim())}
                className="btn-primary mt-4 w-full sm:w-auto"
              >
                提交答案 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Correction
                question={current}
                answer={answer}
                answerLabel={answerLabel(current, answer)}
                correct={correct}
                shortGrade={shortGrade}
                onNext={() => appendResult(correct)}
                onShortRate={(good) => appendResult(good)}
              />
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-[9px] text-muted/60">
          题目基于精读和问答内容生成；判分规则、填空匹配和关键点覆盖均为本地逻辑，不调用大模型。
        </p>
      </PageContainer>
    );
  }

  if (view === "result") {
    const wrong = results.filter((item) => item.correct === false);
    const correct = results.filter((item) => item.correct === true);
    return (
      <PageContainer className="max-w-3xl">
        <div className="card overflow-hidden">
          <div className="border-b border-line/10 bg-accent/[0.055] px-6 py-9 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="eyebrow mt-4">PRACTICE COMPLETE</p>
            <h1 className="mt-2 font-display text-[30px] font-bold text-ink">
              {correct.length} / {results.length}
            </h1>
            <p className="mt-1 text-[12px] text-muted">
              自动判对 {correct.length} 题 · 需再练 {wrong.length} 题 · 简答题按关键点对照
            </p>
          </div>
          <div className="p-5 sm:p-6">
            {wrong.length === 0 ? (
              <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-[12px] text-accent">
                本轮没有需要重练的客观题。简答题请对照参考答案检查表达是否完整。
              </div>
            ) : (
              <div>
                <p className="eyebrow mb-2">需要回看（{wrong.length}）</p>
                <div className="space-y-2">
                  {wrong.map((item, index) => (
                    <div key={`${item.question.id}-${index}`} className="rounded-xl border border-coral/15 bg-coral/[0.025] p-3.5">
                      <div className="flex items-start gap-2">
                        <span className="chip shrink-0">{displayQuestionType(item.question)}</span>
                        <p className="text-[11.5px] font-medium leading-5 text-ink">{plainInline(item.question.prompt)}</p>
                      </div>
                      <p className="mt-1 text-[10px] text-coral">你的答案：{item.answerLabel}</p>
                      <p className="mt-0.5 text-[10px] text-accent">
                        正确答案：{item.question.modelAnswer ? item.question.modelAnswer.split("\n")[0].replace(/^>\s?/, "").slice(0, 160) : "见解析"}
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-muted">{item.question.explanation}</p>
                      {item.question.docId ? (
                        <Link to={`/doc/${item.question.docId}`} className="mt-1 inline-flex items-center gap-1 text-[9.5px] text-accent">
                          回到知识点 <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {wrong.length > 0 ? (
                <button onClick={() => startSession(wrong.map((item) => item.question), "错题重练")} className="btn-primary">
                  <RotateCcw className="h-3.5 w-3.5" /> 只练错题
                </button>
              ) : null}
              <button onClick={() => setView("setup")} className="btn-ghost">返回题库</button>
              <Link to="/progress" className="btn-ghost">查看进度</Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        back={{ to: "/", label: "返回总览" }}
        eyebrow="QUESTION BANK · MULTI-TYPE"
        title="题库"
        description={`${meta.total} 道题，按 21 个知识点组织：简答、填空、判断、多选、单选。提交后立刻显示你的答案、正确答案、原因和对应知识点。`}
        actions={
          <button onClick={() => { setTab("doc"); setDocId("all"); setTypes(["short", "fill", "boolean", "multiple", "single"]); }} className="btn-ghost">
            <Shuffle className="h-3.5 w-3.5" /> 重置筛选
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="题库总量" value={meta.total} hint={`${meta.counts.short} 简答 / ${meta.counts.fill} 填空`} icon={<Layers3 className="h-3.5 w-3.5" />} />
        <StatCard label="题型" value={TYPE_ORDER.length} hint="按知识点分别统计" icon={<ListChecks className="h-3.5 w-3.5" />} />
        <StatCard label="覆盖知识点" value={DOCS.length} hint="21 篇精读" icon={<BookOpen className="h-3.5 w-3.5" />} />
        <StatCard label="错题" value={mistakes.size} hint="答对后自动移除" tone={mistakes.size > 0 ? "coral" : "default"} icon={<RotateCcw className="h-3.5 w-3.5 text-coral" />} />
      </div>

      <div className="sticky top-[60px] z-20 -mx-4 mb-5 border-b border-line/10 bg-paper/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto">
          {(
            [
              ["doc", "按知识点"],
              ["type", "按题型"],
              ["course", "课程选择题"],
              ["mistake", `错题本 ${mistakes.size}`],
            ] as Array<[Tab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                tab === value ? "bg-ink text-paper dark:bg-lime dark:text-[#172014]" : "text-muted hover:bg-raised/60"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1 text-[9px] text-muted/60 sm:flex">
            <Filter className="h-3 w-3" /> 筛选不会跳页
          </span>
        </div>
      </div>

      {tab === "doc" ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[120px] lg:self-start">
            <div className="card overflow-hidden">
              <div className="border-b border-line/10 px-3 py-2.5">
                <p className="eyebrow">知识点</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-1.5">
                <button
                  onClick={() => setDocId("all")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${docId === "all" ? "bg-accent/[0.06] text-accent" : "text-muted hover:bg-raised/60"}`}
                >
                  <span className="font-mono text-[9px]">ALL</span>
                  <span className="flex-1 text-[11px] font-medium">全部知识点</span>
                  <span className="font-mono text-[9px]">{meta.total}</span>
                </button>
                {DOCS.map((doc) => {
                  const stat = statForDoc(docStats, doc.id);
                  const total = stat.total;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setDocId(doc.id)}
                      className={`mt-0.5 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${docId === doc.id ? "bg-accent/[0.06] text-accent" : "text-muted hover:bg-raised/60"}`}
                    >
                      <span className="mt-0.5 font-mono text-[9px]">{doc.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[11px] font-medium ${docId === doc.id ? "text-accent" : "text-ink/80"}`}>{doc.shortTitle}</span>
                        <span className="mt-0.5 flex flex-wrap gap-1 text-[8px]">
                          {TYPE_ORDER.map((type) => {
                            const count = stat.types[type];
                            return count ? <span key={type}>{TYPE_LABEL[type]} {count}</span> : null;
                          })}
                        </span>
                      </span>
                      <span className="font-mono text-[9px] text-muted/60">{total}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section>
            <div className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-1">{selectedDoc ? `${selectedDoc.id} · ${selectedDoc.layer}` : "ALL KNOWLEDGE POINTS"}</p>
                  <h2 className="text-[18px] font-bold text-ink">{selectedDoc?.title ?? "全部知识点混合练习"}</h2>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {selectedDoc?.description ?? "按题型随机抽题；先作答，再看逐题纠正。"}
                  </p>
                </div>
                {selectedDoc ? (
                  <Link to={`/doc/${selectedDoc.id}`} className="chip hover:border-accent/30">
                    <BookOpen className="h-2.5 w-2.5" /> 回到精读
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {TYPE_ORDER.map((type) => {
                  const count = docTypeCounts[type] ?? 0;
                  const selected = types.includes(type);
                  return (
                    <button
                      key={type}
                      disabled={count === 0}
                      onClick={() => toggleType(type)}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected ? "border-accent/35 bg-accent/[0.045]" : "border-line/10 hover:border-accent/25"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${TYPE_COLOR[type]}`}>
                        {selected ? "✓" : ""}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[11.5px] font-semibold text-ink">{TYPE_LABEL[type]}</span>
                          <span className="font-mono text-[9px] text-muted">{count} 题</span>
                        </span>
                        <span className="mt-0.5 block text-[9.5px] leading-4 text-muted">{TYPE_DESC[type]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {types.includes("short") ? (
                <label className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                  <input type="checkbox" checked={includeFollow} onChange={(event) => setIncludeFollow(event.target.checked)} className="accent-[rgb(var(--accent))]" />
                  包含主问题下的追问（更难，适合二轮）
                </label>
              ) : null}

              <div className="mt-4 flex flex-col gap-3 border-t border-line/10 pt-4 sm:flex-row sm:items-center">
                <div className="flex gap-1.5">
                  {[10, 20, 30].map((value) => (
                    <button key={value} onClick={() => setAmount(value)} className={`chip ${amount === value ? "chip-active" : ""}`}>{value} 题</button>
                  ))}
                </div>
                <span className="text-[10px] text-muted">当前可用 <strong className="text-ink">{buildPool().length}</strong> 题</span>
                <button onClick={startFromSetup} disabled={buildPool().length === 0} className="btn-primary sm:ml-auto">
                  <Play className="h-3.5 w-3.5" /> 开始练习
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-line/10 bg-raised/30 px-4 py-3 text-[10px] leading-5 text-muted">
              简答题不是人工/AI 评分：系统会按关键点关键词自动对照，并展示完整参考答案；请以参考答案为准做自我修正。填空和选择题为精确判分。
            </div>
          </section>
        </div>
      ) : null}

      {tab === "type" ? (
        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {TYPE_ORDER.map((type) => {
              const courseSingles = bank.questions.filter((question) => question.stage === "course").length;
              const typeTotal = type === "single" ? meta.counts.single - courseSingles : meta.counts[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    setTypes([type]);
                    setDocId("all");
                  }}
                  className="card group p-4 text-left transition hover:border-accent/30"
                >
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${TYPE_COLOR[type]}`}>
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-[13px] font-semibold text-ink">{TYPE_LABEL[type]}</p>
                  <p className="mt-0.5 font-display text-[22px] font-bold text-ink">{typeTotal}</p>
                  <p className="mt-1 text-[9.5px] leading-4 text-muted">{TYPE_DESC[type]}</p>
                  {type === "single" ? <p className="mt-1 text-[8.5px] text-muted/60">知识点单选；另有 {courseSingles} 道课程单选</p> : null}
                  <span className="mt-3 inline-flex items-center gap-1 text-[9.5px] text-accent opacity-0 transition group-hover:opacity-100">
                    选择题型 <ChevronRight className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-line/10 bg-surface p-4 text-[10.5px] leading-5 text-muted">
            题型说明：简答用于练表达；填空用于记术语；判断用于识别错误说法；多选用于辨析边界；知识点单选由问答生成；课程单选来自五门课程的 210 道原有题库。所有题型提交后都显示纠正与对应知识点。
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/20 bg-accent/[0.045] p-4">
            <span className="text-[10.5px] text-muted">已选题型：<strong className="text-ink">{types.map((type) => TYPE_LABEL[type]).join(" / ")}</strong></span>
            <div className="flex gap-1.5">
              {[10, 20, 30].map((value) => (
                <button key={value} onClick={() => setAmount(value)} className={`chip ${amount === value ? "chip-active" : ""}`}>{value} 题</button>
              ))}
            </div>
            <span className="text-[10px] text-muted">可用 {buildPool().length} 题</span>
            <button onClick={startFromSetup} disabled={buildPool().length === 0} className="btn-primary sm:ml-auto">
              <Play className="h-3.5 w-3.5" /> 开始练习
            </button>
          </div>
        </div>
      ) : null}

      {tab === "course" ? (
        <div className="card p-5 sm:p-6">
          <div className="mb-3">
            <p className="eyebrow mb-1">COURSE BANK · 210 QUESTIONS</p>
            <h2 className="text-[16px] font-bold text-ink">课程选择题</h2>
            <p className="mt-1 text-[11px] text-muted">来自五门课程的单选题库，按课程筛选；不计入知识点精读的题型统计。</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCourse("all")} className={`chip ${course === "all" ? "chip-active" : ""}`}>全部课程</button>
            {[...new Set(bank.questions.filter((question) => question.courseId).map((question) => question.courseName))].map((name) => (
              <button
                key={name}
                onClick={() => setCourse(bank.questions.find((question) => question.courseName === name)?.courseId ?? "all")}
                className={`chip ${course !== "all" && bank.questions.find((question) => question.courseId === course)?.courseName === name ? "chip-active" : ""}`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[10.5px] text-muted">可用 <strong className="text-ink">{bank.questions.filter((question) => question.type === "single" && question.stage === "course" && (course === "all" || question.courseId === course)).length}</strong> 题</span>
            <div className="flex gap-1.5">
              {[10, 20, 30].map((value) => (
                <button key={value} onClick={() => setAmount(value)} className={`chip ${amount === value ? "chip-active" : ""}`}>{value} 题</button>
              ))}
            </div>
            <button
              onClick={() => {
                const pool = bank.questions.filter((question) => question.type === "single" && question.stage === "course" && (course === "all" || question.courseId === course));
                startSession(pool);
              }}
              className="btn-primary sm:ml-auto"
            >
              <Play className="h-3.5 w-3.5" /> 开始课程练习
            </button>
          </div>
        </div>
      ) : null}

      {tab === "mistake" ? (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">MISTAKES</p>
              <h2 className="text-[16px] font-bold text-ink">错题本</h2>
              <p className="mt-1 text-[11px] text-muted">答对后自动移除；每道错题都能回到对应知识点重新读。</p>
            </div>
            {mistakes.size > 0 ? (
              <button onClick={startMistakes} className="btn-primary">
                <RotateCcw className="h-3.5 w-3.5" /> 重练 {mistakes.size} 道
              </button>
            ) : null}
          </div>
          {mistakes.size === 0 ? (
            <div className="mt-4">
              <EmptyState title="还没有错题" description="做完一组题后，答错的客观题会自动进入这里。" action={<button onClick={() => setTab("doc")} className="btn-primary">去练习</button>} />
            </div>
          ) : (
            <div className="mt-4 space-y-1.5">
              {bank.questions.filter((question) => mistakes.has(question.id)).slice(0, 30).map((question) => (
                <div key={question.id} className="flex items-start gap-2 rounded-lg border border-line/10 px-3 py-2.5">
                  <span className="chip shrink-0">{displayQuestionType(question)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[11px] text-ink/85">{plainInline(question.prompt)}</p>
                    <p className="mt-0.5 text-[9px] text-muted">{question.docTitle ?? question.courseName} · 错 {state.quizMistakes[question.id]?.wrongCount ?? 1} 次</p>
                  </div>
                  {question.docId ? (
                    <Link to={`/doc/${question.docId}`} className="shrink-0 text-[9px] text-accent">回看</Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </PageContainer>
  );
}

function Correction({
  question,
  answer,
  answerLabel,
  correct,
  shortGrade,
  onNext,
  onShortRate,
}: {
  question: BankQuestion;
  answer: number | number[] | boolean | string | null;
  answerLabel: string;
  correct: boolean | null;
  shortGrade: ReturnType<typeof gradeShort> | null;
  onNext: () => void;
  onShortRate: (good: boolean) => void;
}) {
  const isShort = question.type === "short";
  const multipleState =
    question.type === "multiple"
      ? checkMultiple(question, Array.isArray(answer) ? (answer as number[]) : [])
      : null;
  const correctAnswer = (() => {
    if (question.type === "single") return plainInline(question.options?.[question.answerIndex ?? 0] ?? "");
    if (question.type === "multiple") return (question.answerIndices ?? []).map((index) => plainInline(question.options?.[index] ?? "")).filter(Boolean).join("；");
    if (question.type === "boolean") return question.answer ? "正确" : "错误";
    if (question.type === "fill") return (question.answers ?? []).map((group) => group[0]).join(" / ");
    return question.modelAnswer?.split("\n")[0]?.replace(/^>\s?/, "") ?? "";
  })();

  return (
    <div className="mt-4 rounded-xl border border-line/10 bg-raised/35 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {isShort ? (
          <span className="chip border-accent/20 bg-accent/[0.06] text-accent">关键点覆盖 {shortGrade?.hits ?? 0}/{shortGrade?.automatic ?? 0}</span>
        ) : correct ? (
          <span className="chip border-accent/20 bg-accent/[0.06] text-accent"><CheckCircle2 className="h-3 w-3" /> 答对</span>
        ) : (
          <span className="chip border-coral/20 bg-coral/[0.06] text-coral"><XCircle className="h-3 w-3" /> 答错</span>
        )}
        {question.type === "fill" && !isShort ? <span className="text-[9px] text-muted">精确匹配，忽略空格和引号</span> : null}
      </div>

      {isShort ? (
        <div className="mt-3">
          <p className="mb-2 text-[10.5px] font-medium text-muted">你的回答：{answerLabel}</p>
          <div className="space-y-2">
            {(shortGrade?.keyPoints ?? []).map((point, index) => (
              <div key={index} className={`rounded-lg border p-2.5 ${point.hit ? "border-accent/20 bg-accent/[0.04]" : "border-line/10 bg-surface"}`}>
                <div className="flex items-start gap-2">
                  {point.hit ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/40" />}
                  <div className="min-w-0">
                    <p className="text-[10.5px] leading-5 text-ink/85">{point.text}</p>
                    <p className="mt-0.5 text-[8.5px] text-muted/60">
                      {point.automatic ? `关键词：${point.terms.slice(0, 6).join(" / ")}` : "未能自动匹配，请对照参考答案自评"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="eyebrow mb-1">完整参考答案</p>
            <MarkdownView markdown={question.modelAnswer ?? ""} docId={`bank-${question.id}`} interactive={false} />
          </div>
          {question.explanation ? (
            <div className="mt-3 rounded-lg bg-surface p-3">
              <p className="eyebrow mb-1">为什么 / 易错点</p>
              <p className="text-[11px] leading-6 text-muted">{plainInline(question.explanation)}</p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => onShortRate(false)} className="btn-ghost">
              <XCircle className="h-3.5 w-3.5 text-coral" /> 还需要练
            </button>
            <button onClick={() => onShortRate(true)} className="btn-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> 对照后算掌握
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-3">
              <p className="text-[9px] text-muted">你的答案</p>
              <p className={`mt-1 text-[11px] leading-5 ${correct ? "text-accent" : "text-coral"}`}>{plainInline(answerLabel)}</p>
            </div>
            <div className="rounded-lg bg-surface p-3">
              <p className="text-[9px] text-muted">正确答案</p>
              <p className="mt-1 text-[11px] leading-5 text-accent">{plainInline(correctAnswer)}</p>
            </div>
          </div>
          {multipleState ? (
            <p className={`mt-2 text-[9.5px] ${multipleState.correct ? "text-accent" : "text-coral"}`}>
              {multipleState.correct
                ? "多选题全部选对。"
                : `多选题需全部选对：漏选 ${multipleState.missed.length} 项，多选 ${multipleState.extra.length} 项。`}
            </p>
          ) : null}
          <div className="mt-3 rounded-lg bg-surface p-3">
            <p className="eyebrow mb-1">为什么</p>
            <p className="text-[11px] leading-6 text-muted">{plainInline(question.explanation)}</p>
          </div>
          <button onClick={onNext} className="btn-primary mt-3 w-full sm:w-auto">
            下一题 <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {question.docId ? (
        <Link to={`/doc/${question.docId}`} className="mt-3 inline-flex items-center gap-1 text-[10px] text-accent">
          <BookOpen className="h-3 w-3" /> 回到对应知识点
        </Link>
      ) : null}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  ListChecks,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { QUIZ_COURSES, QUIZ_LEVELS, QUIZ_QUESTIONS } from "../lib/content";
import { useStore } from "../lib/store";
import { EmptyState, PageContainer, PageHeader, StatCard } from "../components/ui";
import type { QuizQuestion } from "../lib/types";

type Answer = { id: string; selected: number; correct: boolean };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function QuizPage() {
  const { state, recordQuiz } = useStore();
  const [course, setCourse] = useState("all");
  const [level, setLevel] = useState("all");
  const [count, setCount] = useState(10);
  const [session, setSession] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);
  const [label, setLabel] = useState("");

  const mistakes = Object.keys(state.quizMistakes).length;
  const totalAttempts = state.quizAttempts.length;
  const best = state.quizAttempts.reduce(
    (max, attempt) => Math.max(max, attempt.total > 0 ? attempt.score / attempt.total : 0),
    0,
  );

  const poolCount = useMemo(
    () =>
      QUIZ_QUESTIONS.filter(
        (question) =>
          (course === "all" || question.courseId === course) &&
          (level === "all" || question.level === level),
      ).length,
    [course, level],
  );

  const start = (source?: QuizQuestion[], newLabel?: string) => {
    const pool =
      source ??
      QUIZ_QUESTIONS.filter(
        (question) =>
          (course === "all" || question.courseId === course) &&
          (level === "all" || question.level === level),
      );
    if (pool.length === 0) return;
    const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
    setSession(picked);
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setLabel(
      newLabel ??
        `${course === "all" ? "全部课程" : QUIZ_COURSES.find((item) => item.id === course)?.name ?? course} · ${
          level === "all" ? "全部等级" : QUIZ_LEVELS.find((item) => item.id === level)?.label ?? level
        } · ${picked.length} 题`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quit = () => {
    setSession(null);
    setFinished(false);
    setAnswers([]);
    setSelected(null);
  };

  if (finished && session) {
    const correct = answers.filter((answer) => answer.correct).length;
    const wrong = answers.filter((answer) => !answer.correct);
    return (
      <PageContainer className="max-w-3xl">
        <div className="card overflow-hidden">
          <div className="border-b border-line/10 bg-accent/[0.055] px-6 py-9 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="eyebrow mt-4">PRACTICE COMPLETE</p>
            <h1 className="mt-2 font-display text-[30px] font-bold text-ink">
              {correct} / {answers.length}
            </h1>
            <p className="mt-1 text-[12px] text-muted">
              正确率 {Math.round((correct / Math.max(1, answers.length)) * 100)}% · {label}
            </p>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {wrong.length === 0 ? (
              <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-4 text-[12px] text-accent">
                全对。建议去对应精读章节讲一遍原理，再回来做一次。
              </div>
            ) : (
              <div>
                <p className="eyebrow mb-2">需要回看的题（{wrong.length}）</p>
                <div className="space-y-2">
                  {wrong.map((answer) => {
                    const question = session.find((item) => item.id === answer.id);
                    if (!question) return null;
                    return (
                      <div key={answer.id} className="rounded-xl border border-coral/15 bg-coral/[0.025] p-3.5">
                        <p className="text-[11.5px] font-medium leading-5 text-ink">{question.prompt}</p>
                        <p className="mt-1 text-[10px] text-coral">
                          你的选择：{question.options[answer.selected]} · 正确：{question.options[question.answerIndex]}
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-muted">{question.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => start(session, `重做 · ${label}`)} className="btn-primary">
                <RotateCcw className="h-3.5 w-3.5" /> 再做一遍
              </button>
              {wrong.length > 0 ? (
                <button
                  onClick={() =>
                    start(
                      wrong
                        .map((answer) => session.find((item) => item.id === answer.id))
                        .filter((item): item is QuizQuestion => Boolean(item)),
                      "错题重练",
                    )
                  }
                  className="btn-ghost"
                >
                  只练错题
                </button>
              ) : null}
              <button onClick={quit} className="btn-ghost">重新选题</button>
              <Link to="/qa" className="btn-ghost">去面试自测</Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (session) {
    const question = session[index];
    const isAnswered = selected !== null;
    const next = () => {
      if (selected === null) return;
      const answer: Answer = {
        id: question.id,
        selected,
        correct: selected === question.answerIndex,
      };
      const nextAnswers = [...answers, answer];
      if (index + 1 >= session.length) {
        const correct = nextAnswers.filter((item) => item.correct).length;
        recordQuiz(
          {
            courseName: label.split(" · ")[0],
            level: label.split(" · ")[1] ?? "混合",
            score: correct,
            total: nextAnswers.length,
          },
          nextAnswers.filter((item) => !item.correct).map((item) => item.id),
          nextAnswers.filter((item) => item.correct).map((item) => item.id),
        );
        setAnswers(nextAnswers);
        setFinished(true);
      } else {
        setAnswers(nextAnswers);
        setIndex((current) => current + 1);
        setSelected(null);
      }
    };

    return (
      <PageContainer className="max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
          <button onClick={quit} className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowRight className="h-3 w-3 rotate-180" /> 退出练习
          </button>
          <span className="text-line/30">/</span>
          <span>{label}</span>
          <span className="ml-auto font-mono">
            {index + 1} / {session.length}
          </span>
        </div>
        <div className="progress-track mb-5">
          <div className="progress-fill" style={{ width: `${(index / session.length) * 100}%` }} />
        </div>

        <div className="card p-5 sm:p-7">
          <div className="flex flex-wrap gap-1.5 text-[9px]">
            <span className="chip">{question.courseName}</span>
            <span className="chip">{question.chapterTitle}</span>
            <span className="chip">Q{index + 1}</span>
          </div>
          <h1 className="mt-4 text-[16px] font-semibold leading-7 text-ink sm:text-[18px]">
            {question.prompt}
          </h1>
          <div className="mt-5 space-y-2.5">
            {question.options.map((option, optionIndex) => {
              const isSelected = selected === optionIndex;
              const isCorrect = optionIndex === question.answerIndex;
              const showState = isAnswered && (isSelected || isCorrect);
              return (
                <button
                  key={optionIndex}
                  disabled={isAnswered}
                  onClick={() => setSelected(optionIndex)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[12.5px] leading-6 transition ${
                    showState
                      ? isCorrect
                        ? "border-accent/40 bg-accent/[0.06] text-ink"
                        : "border-coral/35 bg-coral/[0.04] text-ink"
                      : "border-line/10 bg-surface text-ink hover:border-accent/30 hover:bg-raised/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[9px] ${
                      showState && isCorrect
                        ? "border-accent bg-accent text-white"
                        : showState
                          ? "border-coral bg-coral text-white"
                          : "border-line/20 text-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showState && isCorrect ? <CheckCircle2 className="h-4 w-4 text-accent" /> : null}
                  {showState && isSelected && !isCorrect ? <XCircle className="h-4 w-4 text-coral" /> : null}
                </button>
              );
            })}
          </div>

          {isAnswered ? (
            <div className="mt-4 rounded-xl border border-line/10 bg-raised/40 p-4">
              <p className="mb-1 text-[10.5px] font-semibold text-ink">
                {selected === question.answerIndex ? "答对了" : "答错了"}
              </p>
              <p className="text-[11px] leading-6 text-muted">{question.explanation}</p>
              <button onClick={next} className="btn-primary mt-3 w-full sm:w-auto">
                {index + 1 >= session.length ? "查看结果" : "下一题"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-center text-[9px] text-muted/60">
          题库自测，答案在本地；不宣称防作弊，重点是暴露盲区。
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="QUIZ · 210 QUESTIONS"
        title="题库练习"
        description="210 道原创单选题，按课程和等级筛选。答题后立即看解析，答错自动进入错题，可单独重练。"
        actions={
          mistakes > 0 ? (
            <button
              onClick={() =>
                start(
                  QUIZ_QUESTIONS.filter((question) => state.quizMistakes[question.id]),
                  "错题重练",
                )
              }
              className="btn-ghost"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 错题重练 {mistakes}
            </button>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="题库总量" value={QUIZ_QUESTIONS.length} hint="5 门课程" icon={<Layers3 className="h-3.5 w-3.5" />} />
        <StatCard label="做过的套数" value={totalAttempts} hint="本机记录" icon={<ListChecks className="h-3.5 w-3.5" />} />
        <StatCard
          label="最高正确率"
          value={`${Math.round(best * 100)}%`}
          hint="历史最佳"
          tone={best >= 0.8 ? "accent" : "default"}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
        />
        <StatCard
          label="待重练错题"
          value={mistakes}
          hint="答对后自动移除"
          tone={mistakes > 0 ? "coral" : "default"}
          icon={<RotateCcw className="h-3.5 w-3.5 text-coral" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-5 sm:p-6">
          <p className="eyebrow mb-3">BUILD A SET</p>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted">课程</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setCourse("all")} className={`chip ${course === "all" ? "chip-active" : ""}`}>
                  全部
                </button>
                {QUIZ_COURSES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCourse(item.id)}
                    className={`chip ${course === item.id ? "chip-active" : ""}`}
                  >
                    {item.name} · {item.count}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted">等级</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setLevel("all")} className={`chip ${level === "all" ? "chip-active" : ""}`}>
                  全部
                </button>
                {QUIZ_LEVELS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLevel(item.id)}
                    className={`chip ${level === item.id ? "chip-active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted">题量</p>
              <div className="flex gap-1.5">
                {[10, 20, 30].map((value) => (
                  <button
                    key={value}
                    onClick={() => setCount(value)}
                    className={`chip ${count === value ? "chip-active" : ""}`}
                  >
                    {value} 题
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-raised/50 px-3.5 py-3 text-[10.5px] text-muted">
              当前筛选：<span className="font-semibold text-ink">{poolCount}</span> 道可用，随机抽{" "}
              {Math.min(count, poolCount)} 道。
            </div>
            <button onClick={() => start()} disabled={poolCount === 0} className="btn-primary w-full">
              开始练习 <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="eyebrow mb-2">最近练习</p>
            {state.quizAttempts.length === 0 ? (
              <p className="text-[10.5px] leading-5 text-muted">
                还没有记录。先做一组 10 题，看看哪些章节需要回去精读。
              </p>
            ) : (
              <div className="space-y-2">
                {state.quizAttempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[10.5px]">
                    <span className="min-w-0 truncate text-muted">{attempt.courseName} · {attempt.level}</span>
                    <span className="ml-2 shrink-0 font-mono font-semibold text-ink">
                      {attempt.score}/{attempt.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-4">
            <p className="eyebrow mb-2">课程覆盖</p>
            <div className="space-y-2.5">
              {QUIZ_COURSES.map((item) => (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-muted">{item.name}</span>
                    <span className="font-mono text-muted/60">{item.count}</span>
                  </div>
                  <div className="progress-track h-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${(item.count / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

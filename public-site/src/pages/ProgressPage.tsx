import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Flame,
  ListChecks,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { ALL_QA, DOCS, QA_MAP, TOTAL_QA } from "../lib/content";
import { formatDate } from "../lib/srs";
import { getQaBankProgress, useStore } from "../lib/store";
import { PageContainer, PageHeader, ProgressRing, StatCard } from "../components/ui";

export function ProgressPage() {
  const {
    state,
    completedDocs,
    masteredQa,
    dueQa,
    streak,
    setTheme,
    setFontSize,
    setLineHeight,
    exportState,
    importState,
    resetState,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const readingMinutes = Math.round(
    DOCS.reduce((sum, doc) => sum + (doc.minutes * (state.docs[doc.id]?.percent ?? 0)) / 100, 0),
  );
  const quizTotal = state.quizAttempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const quizCorrect = state.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const quizAccuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

  const layers = useMemo(
    () =>
      [...new Set(DOCS.map((doc) => doc.layer))].map((layer) => {
        const docs = DOCS.filter((doc) => doc.layer === layer);
        const done = docs.filter((doc) => state.docs[doc.id]?.completed).length;
        return { layer, done, total: docs.length };
      }),
    [state.docs],
  );

  const bankProgress = useMemo(
    () =>
      QA_MAP.size
        ? [...QA_MAP.keys()]
            .map((docId) => {
              const doc = DOCS.find((item) => item.id === docId);
              const progress = getQaBankProgress(state, docId);
              return { docId, title: doc?.shortTitle ?? docId, ...progress };
            })
            .sort((a, b) => b.mastered - a.mastered)
            .slice(0, 6)
        : [],
    [state],
  );

  const week = useMemo(() => {
    const days = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      const count = state.activity.filter((item) => item.at.slice(0, 10) === key).length;
      days.push({ key, label: `${date.getMonth() + 1}/${date.getDate()}`, count });
    }
    return days;
  }, [state.activity]);
  const maxWeek = Math.max(1, ...week.map((day) => day.count));

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `offerpath-deep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已导出备份 JSON，可换设备导入。");
    window.setTimeout(() => setMessage(""), 3000);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      importState(text);
      setMessage("备份已导入。");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入失败，请检查文件。");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    if (window.confirm("确定清空本机的阅读进度、笔记、问答掌握度和练习记录吗？此操作不可撤销。")) {
      resetState();
      setMessage("本机数据已清空。");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="EVIDENCE · LOCAL FIRST"
        title="学习进度"
        description="不统计“看了多久”，只看精读完成、问答掌握、到期复习和练习正确率。所有数据保存在本机浏览器。"
        actions={
          <>
            <Link to="/review" className="btn-ghost">复习队列</Link>
            <Link to="/qa" className="btn-primary">继续自测</Link>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="精读完成" value={`${completedDocs}/${DOCS.length}`} icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />} tone="accent" />
        <StatCard label="问答掌握" value={`${masteredQa}/${TOTAL_QA}`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <StatCard label="今日到期" value={dueQa} icon={<Flame className="h-3.5 w-3.5 text-coral" />} tone={dueQa > 0 ? "coral" : "default"} />
        <StatCard label="连续学习" value={`${streak} 天`} icon={<Flame className="h-3.5 w-3.5" />} />
        <StatCard label="估计阅读" value={`${readingMinutes} 分钟`} icon={<BarChart3 className="h-3.5 w-3.5" />} />
        <StatCard label="题库正确率" value={`${quizAccuracy}%`} hint={`${state.quizAttempts.length} 套记录`} icon={<ListChecks className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">CAPABILITY</p>
                <h2 className="text-[14px] font-semibold text-ink">分层进度</h2>
              </div>
              <ProgressRing percent={(completedDocs / DOCS.length) * 100} size={46} label={`${Math.round((completedDocs / DOCS.length) * 100)}%`} />
            </div>
            <div className="space-y-3">
              {layers.map((layer) => (
                <div key={layer.layer}>
                  <div className="mb-1 flex items-center justify-between text-[10.5px]">
                    <span className="text-muted">{layer.layer}</span>
                    <span className="font-mono text-muted/60">{layer.done}/{layer.total}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${(layer.done / layer.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">WEEKLY ACTIVITY</p>
                <h2 className="text-[14px] font-semibold text-ink">最近 7 天</h2>
              </div>
              <span className="font-mono text-[9px] text-muted/60">{state.activity.length} 条记录</span>
            </div>
            <div className="flex h-28 items-end gap-2">
              {week.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-20 w-full items-end rounded-md bg-raised/40">
                    <div
                      className="w-full rounded-md bg-accent/70 transition-all"
                      style={{ height: `${Math.max(4, (day.count / maxWeek) * 100)}%` }}
                      title={`${day.count} 条记录`}
                    />
                  </div>
                  <span className="text-[8.5px] text-muted/60">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">Q&A MASTERY</p>
                <h2 className="text-[14px] font-semibold text-ink">问答掌握度</h2>
              </div>
              <Link to="/qa" className="text-[10px] text-accent">去自测 →</Link>
            </div>
            <div className="space-y-2.5">
              {bankProgress.map((bank) => (
                <div key={bank.docId}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <Link to={`/qa/${bank.docId}`} className="text-muted hover:text-ink">{bank.title}</Link>
                    <span className="font-mono text-muted/60">{bank.mastered}/{bank.total}</span>
                  </div>
                  <div className="progress-track h-1">
                    <div className="progress-fill" style={{ width: `${(bank.mastered / bank.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">QUIZ HISTORY</p>
                <h2 className="text-[14px] font-semibold text-ink">最近练习</h2>
              </div>
              <Link to="/quiz" className="text-[10px] text-accent">去练习 →</Link>
            </div>
            {state.quizAttempts.length === 0 ? (
              <p className="rounded-xl bg-raised/50 p-3 text-[10.5px] leading-5 text-muted">
                还没有练习记录。做一组 10 题，看看哪些章节需要回去精读。
              </p>
            ) : (
              <div className="divide-y divide-line/10">
                {state.quizAttempts.slice(0, 6).map((attempt) => (
                  <div key={attempt.id} className="flex items-center gap-3 py-2.5 text-[10.5px]">
                    <span className="flex-1 truncate text-muted">{attempt.courseName} · {attempt.level}</span>
                    <span className="font-mono text-muted/60">{formatDate(attempt.at)}</span>
                    <span className="w-12 text-right font-mono font-semibold text-ink">
                      {attempt.score}/{attempt.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-[12px] font-semibold text-ink">阅读设置</h2>
            </div>
            <div className="space-y-3 text-[10.5px] text-muted">
              <div>
                <p className="mb-1.5">主题</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setTheme("light")} className={`chip ${state.theme === "light" ? "chip-active" : ""}`}>浅色</button>
                  <button onClick={() => setTheme("dark")} className={`chip ${state.theme === "dark" ? "chip-active" : ""}`}>深色</button>
                </div>
              </div>
              <div>
                <p className="mb-1.5">正文字号 · {state.fontSize.toFixed(1)}px</p>
                <input
                  type="range"
                  min={15}
                  max={22}
                  step={0.5}
                  value={state.fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-full accent-[rgb(var(--accent))]"
                />
              </div>
              <div>
                <p className="mb-1.5">行高 · {state.lineHeight.toFixed(2)}</p>
                <input
                  type="range"
                  min={1.5}
                  max={2.2}
                  step={0.05}
                  value={state.lineHeight}
                  onChange={(event) => setLineHeight(Number(event.target.value))}
                  className="w-full accent-[rgb(var(--accent))]"
                />
              </div>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-[12px] font-semibold text-ink">数据备份</h2>
            </div>
            <p className="mb-3 text-[9.5px] leading-5 text-muted">
              进度、笔记、问答和练习记录只在本机。换设备或清浏览器前先导出 JSON。
            </p>
            <div className="space-y-2">
              <button onClick={download} className="btn-primary w-full py-2 text-[11px]">
                <Download className="h-3.5 w-3.5" /> 导出备份
              </button>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full py-2 text-[11px]">
                <Upload className="h-3.5 w-3.5" /> 导入备份
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => upload(event.target.files?.[0])}
              />
              <button onClick={reset} className="w-full rounded-lg py-2 text-[10px] text-coral transition hover:bg-coral/[0.06]">
                <Trash2 className="mr-1 inline h-3 w-3" /> 清空本机数据
              </button>
            </div>
            {message ? <p className="mt-2 text-[9.5px] text-accent">{message}</p> : null}
            {error ? <p className="mt-2 text-[9.5px] text-coral">{error}</p> : null}
          </section>

          <div className="rounded-xl border border-line/10 bg-raised/30 p-3.5 text-[9px] leading-5 text-muted/70">
            平台不收集你的阅读记录，也没有登录。这样更轻，但换浏览器不会自动同步；请用备份。
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

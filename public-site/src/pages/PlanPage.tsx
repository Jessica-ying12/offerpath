import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  Route,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { DOC_MAP, DOCS, PLAN_WEEKS, ROLES } from "../lib/content";
import { analyzeJd, docsForRole, prioritizedDocs } from "../lib/jd";
import { useStore } from "../lib/store";
import { DocCard, PageContainer, PageHeader } from "../components/ui";

export function PlanPage() {
  const { state, setRole, setJd } = useStore();
  const [jdDraft, setJdDraft] = useState(state.jd);
  const [saved, setSaved] = useState(false);
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];
  const analysis = useMemo(() => analyzeJd(jdDraft), [jdDraft]);
  const recommended = prioritizedDocs(state.role, jdDraft).slice(0, 6);
  const roleDocs = docsForRole(state.role);

  const save = () => {
    setJd(jdDraft.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <PageContainer>
      <PageHeader
        back={{ to: "/roadmap", label: "返回完整路线图" }}
        eyebrow="TARGET → PATH → EVIDENCE"
        title="学习路径"
        description="先选目标岗位，再粘贴 JD。平台按命中技术重排 21 篇精读，并给出 10 周路径、产出和验收标准。"
        actions={
          <Link to="/docs" className="btn-ghost">
            直接看文档 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <section className="card mb-6 p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <h2 className="text-[13px] font-semibold text-ink">1. 你的目标岗位</h2>
          <span className="ml-auto text-[9px] text-muted/60">决定默认排序与模块范围</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {ROLES.map((item) => {
            const selected = state.role === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setRole(item.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-accent/40 bg-accent/[0.06]"
                    : "border-line/10 bg-surface hover:border-accent/25"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11.5px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>
                    {item.label}
                  </span>
                  {selected ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <Circle className="h-3.5 w-3.5 text-line/30" />}
                </div>
                <p className="mt-1 text-[9px] leading-4 text-muted">{item.desc}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-muted">
          当前目标：<span className="font-semibold text-ink">{role.label}</span> · 对应 {roleDocs.length} 篇精读
        </p>
      </section>

      <section className="card mb-6 p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 text-accent" />
          <h2 className="text-[13px] font-semibold text-ink">2. 粘贴目标 JD（可选）</h2>
          <span className="ml-auto text-[9px] text-muted/60">只在本机分析</span>
        </div>
        <textarea
          value={jdDraft}
          onChange={(event) => setJdDraft(event.target.value)}
          rows={6}
          placeholder="把岗位职责与任职要求粘进来，例如：熟悉 React Native、微信小程序、TypeScript、WebView/JSBridge，有性能优化与工程化经验…"
          className="w-full resize-y rounded-xl border border-line/10 bg-paper/45 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={save} className="btn-primary">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "已保存" : "保存并分析"}
          </button>
          <span className="text-[9.5px] text-muted/60">
            {jdDraft.length} 字符 · 规则匹配，不调用大模型
          </span>
          {state.jd ? (
            <Link to="/docs" className="ml-auto text-[10px] text-accent">
              查看按 JD 排序的文档 →
            </Link>
          ) : null}
        </div>

        {jdDraft.trim() ? (
          <div className="mt-4 border-t border-line/10 pt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted">命中技术：</span>
              {analysis.matched.length === 0 ? (
                <span className="chip">没有识别到词表中的技术，换一种写法试试</span>
              ) : (
                analysis.matched.map((item) => (
                  <span key={item.label} className="chip border-accent/20 bg-accent/[0.06] text-accent">
                    {item.label}
                  </span>
                ))
              )}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-accent/[0.04] p-3.5">
                <p className="mb-2 text-[10px] font-semibold text-accent">优先精读</p>
                <div className="space-y-1">
                  {recommended.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/doc/${doc.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10.5px] text-ink/100 transition hover:bg-surface"
                    >
                      <span className="font-mono text-[9px] text-muted/60">{doc.id}</span>
                      <span className="line-clamp-1 flex-1">{doc.title}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-muted" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-raised/50 p-3.5">
                <p className="mb-2 text-[10px] font-semibold text-ink">JD 没提，但面试常考</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingCore.slice(0, 6).map((doc) => (
                    <Link key={doc.id} to={`/doc/${doc.id}`} className="chip bg-surface hover:border-accent/30">
                      {doc.shortTitle}
                    </Link>
                  ))}
                </div>
                <p className="mt-2 text-[9px] leading-4 text-muted/70">
                  缺失不代表必须学，按你的时间和岗位优先级取舍。
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-3 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">10-WEEK ROADMAP</p>
          <h2 className="text-[16px] font-bold text-ink">3. 从基础到面试的十周路径</h2>
        </div>
        <span className="text-[9.5px] text-muted/60">按你的目标重排精读顺序</span>
      </section>

      <div className="space-y-3">
        {PLAN_WEEKS.map((week) => {
          const docs = week.docs.map((id) => DOC_MAP.get(id)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
          const done = docs.filter((doc) => state.docs[doc.id]?.completed).length;
          const complete = done === docs.length;
          return (
            <div key={week.week} className="card p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl font-mono ${
                    complete ? "bg-accent text-white" : "bg-raised text-muted"
                  }`}
                >
                  <span className="text-[8px] uppercase">WEEK</span>
                  <span className="text-[15px] font-semibold leading-none">{week.week}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-ink">{week.title}</h3>
                    {complete ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-accent">
                        <CheckCircle2 className="h-3 w-3" /> 完成
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-muted/60">
                        {done}/{docs.length}
                      </span>
                    )}
                    <span className="ml-auto text-[9px] text-muted/60">{week.output}</span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-5 text-muted">{week.daily}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {docs.map((doc) => (
                      <Link
                        key={doc.id}
                        to={`/doc/${doc.id}`}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9.5px] transition ${
                          state.docs[doc.id]?.completed
                            ? "border-accent/25 bg-accent/[0.05] text-accent"
                            : "border-line/10 bg-surface text-muted hover:border-accent/30 hover:text-ink"
                        }`}
                      >
                        {doc.id} · {doc.shortTitle}
                        {state.docs[doc.id]?.completed ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                      </Link>
                    ))}
                  </div>
                  <div className="progress-track mt-2.5 h-1">
                    <div className="progress-fill" style={{ width: `${(done / docs.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {recommended.slice(0, 2).map((doc) => (
          <DocCard key={doc.id} doc={doc} showMatch compact />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line/10 bg-raised/30 px-4 py-3 text-[10px] text-muted">
        <Compass className="h-3.5 w-3.5 text-accent" />
        路径只是顺序建议，不是锁死的课程表。每篇精读后做配套问答，再用题库检查理解。
      </div>
    </PageContainer>
  );
}

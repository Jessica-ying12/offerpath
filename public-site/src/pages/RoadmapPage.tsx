import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Compass,
  ExternalLink,
  GitBranch,
  Layers3,
  MessageSquareQuote,
  Play,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import { DOCS, DOC_MAP, QA_MAP, ROLES } from "../lib/content";
import {
  ROADMAP_TRACKS,
  stagesForTrack,
  type RoadmapNode,
  type RoadmapStage,
  type RoadmapTrackId,
} from "../data/roadmap";
import { useStore } from "../lib/store";
import questionMeta from "../data/question-meta.json";
import { PageContainer, PageHeader, ProgressRing, StatCard } from "../components/ui";

type Status = "done" | "active" | "todo" | "external";

function nodeDocs(node: RoadmapNode) {
  return (node.docs ?? []).map((id) => DOC_MAP.get(id)).filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
}

function nodeStatus(node: RoadmapNode, state: ReturnType<typeof useStore>["state"]): Status {
  const docs = nodeDocs(node);
  if (docs.length === 0) return "external";
  const completed = docs.filter((doc) => state.docs[doc.id]?.completed).length;
  if (completed === docs.length) return "done";
  const started = docs.some((doc) => (state.docs[doc.id]?.percent ?? 0) > 0);
  return started ? "active" : "todo";
}

function stageStats(stage: RoadmapStage, state: ReturnType<typeof useStore>["state"]) {
  const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))].map((id) => DOC_MAP.get(id)).filter(Boolean);
  const completed = docs.filter((doc) => state.docs[doc!.id]?.completed).length;
  return { total: docs.length, completed };
}

function statusLabel(status: Status) {
  if (status === "done") return "已完成";
  if (status === "active") return "在学";
  if (status === "external") return "路线 + 题库";
  return "未开始";
}

export function RoadmapPage() {
  const { state } = useStore();
  const [track, setTrack] = useState<RoadmapTrackId>(
    (ROADMAP_TRACKS.some((item) => item.id === state.role) ? state.role : "mobile") as RoadmapTrackId,
  );
  const stages = useMemo(() => stagesForTrack(track), [track]);

  const allDocs = useMemo(
    () => [...new Set(stages.flatMap((stage) => stage.nodes.flatMap((node) => node.docs ?? [])))]
      .map((id) => DOC_MAP.get(id))
      .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)),
    [stages],
  );
  const completed = allDocs.filter((doc) => state.docs[doc.id]?.completed).length;
  const currentNode = stages
    .flatMap((stage) => stage.nodes)
    .find((node) => {
      const status = nodeStatus(node, state);
      return status === "active" || status === "todo";
    });
  const currentDoc = currentNode ? nodeDocs(currentNode)[0] : undefined;
  const trackLabel = ROADMAP_TRACKS.find((item) => item.id === track)?.label ?? "移动前端";

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> 总览
        </Link>
        <span className="text-line/30">/</span>
        <span>完整路线图</span>
        <span className="ml-auto inline-flex items-center gap-1 text-muted/60">
          <GitBranch className="h-3 w-3" /> 路线参考 roadmap.sh，节点为本平台编排
        </span>
      </div>

      <PageHeader
        eyebrow="FULL ROADMAP · FROM ZERO TO INTERVIEW"
        title="完整学习路线图"
        description="不是一篇文档列表，而是一条从准备、语言、框架、工程化到项目面试的路径。每个节点都给出为什么学、学完能做什么、对应精读/自测/题库和官方资料。"
        actions={
          <>
            <Link to="/plan" className="btn-ghost">
              <Clock3 className="h-4 w-4" /> 10 周计划
            </Link>
            {currentDoc ? (
              <Link to={`/doc/${currentDoc.id}`} className="btn-primary">
                <Play className="h-3.5 w-3.5" /> 继续当前节点
              </Link>
            ) : null}
          </>
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line/10 bg-surface p-1.5">
        {ROADMAP_TRACKS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTrack(item.id)}
            className={`shrink-0 rounded-xl px-3 py-2 text-left transition ${
              track === item.id ? "bg-ink text-paper dark:bg-lime dark:text-[#172014]" : "text-muted hover:bg-raised/60"
            }`}
          >
            <span className="block text-[11px] font-semibold">{item.label}</span>
            <span className={`mt-0.5 block text-[8.5px] ${track === item.id ? "opacity-65" : "text-muted/60"}`}>{item.description}</span>
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-line/10 bg-surface p-4 shadow-card sm:p-5 lg:grid-cols-[1fr_260px] lg:items-center">
        <div className="flex items-center gap-4">
          <ProgressRing percent={allDocs.length ? (completed / allDocs.length) * 100 : 0} size={72} label={`${completed}/${allDocs.length}`} />
          <div className="min-w-0">
            <p className="eyebrow mb-1">YOUR POSITION · {trackLabel}</p>
            <p className="text-[15px] font-bold text-ink">
              {currentNode ? currentNode.title : "这条路线已完成"}
            </p>
            <p className="mt-1 line-clamp-2 text-[10.5px] leading-5 text-muted">
              {currentNode?.outcome ?? "可以选择更高阶节点，或进入项目与面试冲刺。"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line/10 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div>
            <p className="font-display text-[20px] font-bold text-ink">{allDocs.length}</p>
            <p className="text-[9px] text-muted">节点关联精读</p>
          </div>
          <div>
            <p className="font-display text-[20px] font-bold text-ink">{stages.length}</p>
            <p className="text-[9px] text-muted">阶段</p>
          </div>
          <div>
            <p className="font-display text-[20px] font-bold text-accent">{completed}</p>
            <p className="text-[9px] text-muted">已完成</p>
          </div>
          <div>
            <p className="font-display text-[20px] font-bold text-coral">{allDocs.length - completed}</p>
            <p className="text-[9px] text-muted">待推进</p>
          </div>
        </div>
      </div>

      {track === "backend" ? (
        <div className="mb-5 rounded-xl border border-accent/20 bg-accent/[0.045] px-4 py-3 text-[10.5px] leading-5 text-muted">
          <strong className="text-ink">后端路线说明：</strong>
          公开站的深度精读目前聚焦移动前端；Java 后端节点提供完整阶段、课程题库（48 道 Java + 18 道 MySQL + 18 道计算机基础）和官方资料入口。完整训练版还包含后端模拟面试与账号记录。
        </div>
      ) : null}

      <nav className="mb-6 flex items-center gap-1 overflow-x-auto pb-1" aria-label="阶段导航">
        {stages.map((stage, index) => {
          const stats = stageStats(stage, state);
          return (
            <button
              key={stage.id}
              onClick={() => document.getElementById(`stage-${stage.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line/10 bg-surface px-2.5 py-1.5 text-[10px] text-muted transition hover:border-accent/30 hover:text-ink"
            >
              <span className="font-mono text-[9px] text-accent">{String(index + 1).padStart(2, "0")}</span>
              {stage.title}
              {stats.total > 0 ? <span className="font-mono text-[8px] text-muted/60">{stats.completed}/{stats.total}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-8">
        {stages.map((stage, stageIndex) => {
          const stats = stageStats(stage, state);
          return (
            <section key={stage.id} id={`stage-${stage.id}`} className="scroll-mt-24">
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-[12px] font-semibold text-lime dark:bg-lime dark:text-[#172014]">
                  {String(stageIndex + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[20px] font-bold text-ink">{stage.title}</h2>
                    <span className="text-[10px] text-muted">{stage.subtitle}</span>
                    {stats.total > 0 ? (
                      <span className="ml-auto font-mono text-[9px] text-muted/60">{stats.completed}/{stats.total} 篇精读</span>
                    ) : (
                      <span className="ml-auto text-[9px] text-muted/60">外部资料 + 题库</span>
                    )}
                  </div>
                  {stats.total > 0 ? (
                    <div className="progress-track mt-2 h-1">
                      <div className="progress-fill" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {stage.nodes.map((node) => {
                  const status = nodeStatus(node, state);
                  const docs = nodeDocs(node);
                  const qa = node.qaDoc ? QA_MAP.get(node.qaDoc) : null;
                  const bankCount = node.bankDoc ? questionMeta.byDoc[node.bankDoc as keyof typeof questionMeta.byDoc]?.total ?? 0 : 0;
                  return (
                    <div key={node.id} className={`rounded-2xl border bg-surface p-4 ${status === "done" ? "border-accent/25" : status === "active" ? "border-accent/35" : "border-line/10"}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${status === "done" ? "bg-accent" : status === "active" ? "bg-coral" : "bg-line/25"}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-[13px] font-semibold text-ink">{node.title}</h3>
                            <span className={`chip ${node.priority === "核心" ? "border-accent/20 text-accent" : node.priority === "进阶" ? "" : "border-coral/15 text-coral"}`}>{node.priority}</span>
                            <span className="ml-auto text-[8.5px] text-muted/60">{statusLabel(status)}</span>
                          </div>
                          <p className="mt-0.5 text-[9.5px] text-muted">{node.subtitle}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[10.5px] leading-5 text-muted">{node.description}</p>
                      <p className="mt-1.5 rounded-lg bg-raised/45 px-2.5 py-2 text-[9.5px] leading-5 text-ink/70">
                        <span className="font-semibold text-accent">学完能：</span>{node.outcome}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {docs.map((doc) => (
                          <Link key={doc.id} to={`/doc/${doc.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
                            <BookOpen className="h-2.5 w-2.5" /> 精读 {doc.id}
                          </Link>
                        ))}
                        {qa ? (
                          <Link to={`/qa/${node.qaDoc}`} className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
                            <MessageSquareQuote className="h-2.5 w-2.5" /> 自测 {qa.items.length}
                          </Link>
                        ) : null}
                        {bankCount > 0 ? (
                          <Link to={`/quiz?doc=${node.bankDoc}`} className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
                            <Layers3 className="h-2.5 w-2.5" /> 练题 {bankCount}
                          </Link>
                        ) : null}
                        {(node.courseIds ?? []).map((courseId) => (
                          <Link key={courseId} to={`/quiz?tab=course&course=${courseId}`} className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
                            <Layers3 className="h-2.5 w-2.5" /> 课程题库
                          </Link>
                        ))}
                        {(node.external ?? []).slice(0, 2).map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
                            {source.label} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line/10 bg-surface p-4">
          <p className="eyebrow mb-2">路线参考</p>
          <p className="text-[10.5px] leading-5 text-muted">阶段与知识边界参考 roadmap.sh 的角色路线；本平台重新编排了精读、问答、题库和项目产出。</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a href="https://roadmap.sh/frontend" target="_blank" rel="noreferrer noopener" className="chip hover:border-accent/30">Frontend ↗</a>
            <a href="https://roadmap.sh/react-native" target="_blank" rel="noreferrer noopener" className="chip hover:border-accent/30">React Native ↗</a>
            <a href="https://roadmap.sh/backend" target="_blank" rel="noreferrer noopener" className="chip hover:border-accent/30">Backend ↗</a>
            <a href="https://roadmap.sh/computer-science" target="_blank" rel="noreferrer noopener" className="chip hover:border-accent/30">CS ↗</a>
          </div>
        </div>
        <div className="rounded-2xl border border-line/10 bg-surface p-4">
          <p className="eyebrow mb-2">怎么用这条路</p>
          <p className="text-[10.5px] leading-5 text-muted">先按顺序完成核心节点，再选进阶/加分。每个节点至少做一次精读 + 一组自测 + 10 道题，最后用项目讲出来。</p>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-accent/[0.045] p-4">
          <p className="eyebrow mb-2 text-accent/70">按岗位定制</p>
          <p className="text-[10.5px] leading-5 text-muted">把目标 JD 粘进来，平台会按命中技术重排模块和 10 周计划。</p>
          <Link to="/plan" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">打开学习计划 <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </div>
    </PageContainer>
  );
}

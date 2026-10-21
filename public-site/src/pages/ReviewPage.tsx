import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ALL_QA, DOC_MAP, DOCS } from "../lib/content";
import { DAY_MS, formatDate, isDue } from "../lib/srs";
import { useStore } from "../lib/store";
import { EmptyState, PageContainer, PageHeader, StatCard } from "../components/ui";

export function ReviewPage() {
  const { state, dueQa, masteredQa } = useStore();

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of ALL_QA) {
      const progress = state.qa[item.id];
      if (!progress || !isDue(progress)) continue;
      map.set(item.docId, (map.get(item.docId) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([docId, count]) => ({ doc: DOC_MAP.get(docId), count }))
      .filter((item) => item.doc)
      .sort((a, b) => b.count - a.count);
  }, [state.qa]);

  const reread = useMemo(
    () =>
      DOCS.filter((doc) => {
        const progress = state.docs[doc.id];
        if (!progress?.completed || !progress.completedAt) return false;
        return Date.now() - new Date(progress.completedAt).getTime() > 7 * DAY_MS;
      }).slice(0, 4),
    [state.docs],
  );

  const firstDue = groups[0];
  const firstDueId = firstDue?.doc?.id;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="SPACED REVIEW · D+1 / D+3 / D+7"
        title="周期复习"
        description="先遮住答案，用自己的话回答。答上来进入下一轮，答错回到 D+1；三次通过才标记「已掌握」。"
        actions={
          firstDueId ? (
            <Link to={`/qa/${firstDueId}/session?mode=due`} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> 开始今日复习
            </Link>
          ) : (
            <Link to="/qa" className="btn-ghost">去做新自测</Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="今日到期"
          value={dueQa}
          hint="优先清空"
          tone={dueQa > 0 ? "coral" : "default"}
          icon={<Flame className="h-3.5 w-3.5 text-coral" />}
        />
        <StatCard
          label="已掌握"
          value={masteredQa}
          hint="三次通过"
          tone="accent"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
        />
        <StatCard label="复习分册" value={groups.length} hint="按文档分组" icon={<RotateCcw className="h-3.5 w-3.5" />} />
        <StatCard
          label="重读建议"
          value={reread.length}
          hint="完成精读 7 天后"
          icon={<BookOpen className="h-3.5 w-3.5" />}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5 text-accent" />}
          title="今天没有到期的问答"
          description="新完成的问答会在 D+1 进入队列。也可以现在做一组新自测，提前建立复习计划。"
          action={
            <div className="flex gap-2">
              <Link to="/qa" className="btn-primary">去自测</Link>
              <Link to="/docs" className="btn-ghost">继续精读</Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(({ doc, count }) => {
            if (!doc) return null;
            return (
              <div key={doc.id} className="card flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/10 font-mono text-[12px] font-semibold text-coral">
                    {doc.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-semibold text-ink">{doc.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {count} 道问答到期 · {doc.layer}
                    </p>
                  </div>
                  <span className="rounded-full bg-coral/10 px-2 py-0.5 font-mono text-[9px] text-coral">
                    {count}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/qa/${doc.id}/session?mode=due`}
                    className="flex-1 rounded-lg bg-ink py-1.5 text-center text-[10px] font-medium text-paper transition hover:bg-ink/90 dark:bg-lime dark:text-[#172014]"
                  >
                    复习这组
                  </Link>
                  <Link
                    to={`/qa/${doc.id}`}
                    className="flex-1 rounded-lg border border-line/10 py-1.5 text-center text-[10px] font-medium text-muted transition hover:border-accent/30 hover:text-accent"
                  >
                    查看问答
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-accent" /> 重读建议
            </span>
            <span className="text-[9px] text-muted/60">完成精读超过 7 天</span>
          </div>
          {reread.length === 0 ? (
            <p className="rounded-xl bg-raised/50 p-3 text-[10.5px] leading-5 text-muted">
              还没有需要重读的精读篇目。完成更多精读后，这里会提醒你回看关键章节。
            </p>
          ) : (
            <div className="space-y-1">
              {reread.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/doc/${doc.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-raised/60"
                >
                  <span className="font-mono text-[9px] text-muted/60">{doc.id}</span>
                  <span className="line-clamp-1 flex-1 text-[11px] text-ink/105">{doc.title}</span>
                  <span className="text-[9px] text-muted">
                    {formatDate(state.docs[doc.id]?.completedAt ?? null)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line/10 bg-raised/30 p-4">
          <p className="eyebrow mb-2">复习规则</p>
          <div className="space-y-2 text-[10.5px] leading-5 text-muted">
            <p><strong className="text-ink">第一次通过</strong>：3 天后复习。</p>
            <p><strong className="text-ink">第二次通过</strong>：7 天后再复习。</p>
            <p><strong className="text-ink">第三次通过</strong>：标记已掌握。</p>
            <p><strong className="text-coral">答错</strong>：回到 D+1，次数不增加。</p>
          </div>
          <div className="mt-3 border-t border-line/10 pt-3 text-[9.5px] leading-5 text-muted/70">
            只看答案不算复习。先遮住答案，能完整讲出结论、机制和取舍，再点「答上来了」。
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

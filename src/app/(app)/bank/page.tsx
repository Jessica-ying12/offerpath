import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Filter, ListChecks, Search, Sparkles } from "lucide-react";
import {
  Badge,
  buttonClass,
  EmptyState,
  PageHeader,
  Panel,
  SectionLabel,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import {
  getBankFacets,
  selectBankQuestions,
  type BankFilters,
} from "@/lib/services/bank";
import { getAllTechSkills, getSkill, getTracks } from "@/lib/content";
import { LEVELS, LEVEL_LABEL, TRACK_IDS, type LevelId, type TrackId } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "题库练习" };

export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; level?: string; tech?: string; difficulty?: string; count?: string }>;
}) {
  await requireUser("/bank");
  const query = await searchParams;
  const trackId = TRACK_IDS.includes(query.track as TrackId) ? (query.track as TrackId) : undefined;
  const level = LEVELS.includes(query.level as LevelId) ? (query.level as LevelId) : undefined;
  const skillId = getSkill(query.tech ?? "") ? query.tech : undefined;
  const difficulty = ["1", "2", "3"].includes(query.difficulty ?? "")
    ? (Number(query.difficulty) as 1 | 2 | 3)
    : undefined;
  const count = Math.min(30, Math.max(5, Number(query.count) || 10));
  const filters: BankFilters = { trackId, level, skillId, difficulty };
  const facets = getBankFacets();
  const totalFiltered = getTracks().flatMap((track) =>
    track.questions.filter((question) => {
      if (trackId && track.id !== trackId) return false;
      if (level && question.level !== level) return false;
      if (skillId && !question.skills.includes(skillId)) return false;
      if (difficulty && question.difficulty !== difficulty) return false;
      return true;
    }),
  ).length;
  const preview = selectBankQuestions(filters, count, 42);
  const startHref = `/bank/practice?${new URLSearchParams({
    ...(trackId ? { track: trackId } : {}),
    ...(level ? { level } : {}),
    ...(skillId ? { tech: skillId } : {}),
    ...(difficulty ? { difficulty: String(difficulty) } : {}),
    count: String(count),
  }).toString()}`;
  const activeTech = skillId ? getSkill(skillId) : null;

  return (
    <div>
      <PageHeader
        eyebrow="QUESTION BANK / FILTERED PRACTICE"
        title={
          <>
            {facets.total} 道题，
            <br className="sm:hidden" />
            按你的目标筛着练。
          </>
        }
        description="题库来自全部已上线课程，支持按岗位、课程、技术、等级和难度筛选。每道题提交后服务端判分并给出解析；做错的题仍进入错题复习。"
        actions={
          <Link href="/exam" className={buttonClass("secondary", "sm")}>
            模拟笔试
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <Panel className="mb-4 p-4 sm:p-5">
        <form method="get" action="/bank" className="grid gap-3 md:grid-cols-[1fr_0.8fr_1fr_0.8fr_0.6fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">课程</span>
            <select name="track" defaultValue={trackId ?? ""} className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-2.5 text-[12px] text-paper">
              <option value="">全部课程</option>
              {getTracks().map((track) => (
                <option key={track.id} value={track.id}>{track.shortName}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">等级</span>
            <select name="level" defaultValue={level ?? ""} className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-2.5 text-[12px] text-paper">
              <option value="">全部</option>
              {LEVELS.map((item) => (
                <option key={item} value={item}>{LEVEL_LABEL[item]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">技术</span>
            <select name="tech" defaultValue={skillId ?? ""} className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-2.5 text-[12px] text-paper">
              <option value="">全部技术</option>
              {getAllTechSkills().map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">难度</span>
            <select name="difficulty" defaultValue={difficulty ?? ""} className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-2.5 text-[12px] text-paper">
              <option value="">全部</option>
              <option value="1">基础</option>
              <option value="2">进阶</option>
              <option value="3">挑战</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] text-muted">题数</span>
            <select name="count" defaultValue={String(count)} className="h-10 w-full rounded-lg border border-white/10 bg-ink-900 px-2.5 text-[12px] text-paper">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
            </select>
          </label>
          <button type="submit" className={buttonClass("primary", "md", "h-10")}>
            <Filter className="h-3.5 w-3.5" />
            筛题
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-muted/50">筛选结果：{totalFiltered} 题</span>
          {activeTech ? <Badge tone="lime">{activeTech.name}</Badge> : null}
          {trackId ? <Badge tone="outline">{getTracks().find((track) => track.id === trackId)?.shortName}</Badge> : null}
          {level ? <Badge tone="outline">{LEVEL_LABEL[level]}</Badge> : null}
          <Link href="/bank" className="ml-auto text-[10px] text-muted transition hover:text-paper">
            清除筛选
          </Link>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {preview.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <SectionLabel index="SAMPLE">本次抽题预览</SectionLabel>
                <span className="font-mono text-[9px] text-muted/40">{preview.length} / {totalFiltered}</span>
              </div>
              {preview.map((question, index) => (
                <Panel key={question.id} className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 font-mono text-[10px] text-muted/30">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] leading-6 text-paper/85">{question.prompt}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[9px] text-muted/40">
                      <span>{question.trackName}</span>
                      <span>·</span>
                      <span>{question.chapterTitle}</span>
                      <span>·</span>
                      <span>{LEVEL_LABEL[question.level]}</span>
                      {question.difficulty ? <span>· D{question.difficulty}</span> : null}
                    </div>
                  </div>
                </Panel>
              ))}
              <Panel tone="accent" className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[14px] font-medium text-paper">准备好了？开始 {count} 题练习</p>
                  <p className="mt-1 text-[11px] text-muted">提交后统一判分；答错的题会进入错题队列，可单独重做。</p>
                </div>
                <Link href={startHref} className={buttonClass("primary", "md")}>
                  <ListChecks className="h-4 w-4" />
                  开始练习
                </Link>
              </Panel>
            </>
          ) : (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="这个筛选条件没有题目"
              description="取消一个筛选条件，或回到技术库选择已开放的技术。题库只展示真实题目，不用占位填充。"
              action={<Link href="/bank" className={buttonClass("secondary", "sm")}>清除筛选</Link>}
            />
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel index="COVERAGE">题库覆盖</SectionLabel>
              <span className="font-mono text-[9px] text-muted/40">{facets.total}</span>
            </div>
            <div className="mt-3 space-y-2">
              {facets.byTrack.map((item) => (
                <div key={item.trackId} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">{item.name}</span>
                  <span className="font-mono text-paper/60">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
              {facets.byLevel.map((item) => (
                <div key={item.level} className="flex-1 text-center">
                  <p className="font-mono text-[13px] text-paper">{item.count}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime" />
              <p className="text-[12px] font-medium text-paper">怎么练更有用</p>
            </div>
            <ol className="mt-3 space-y-2 text-[10px] leading-5 text-muted/65">
              <li>1. 按目标技术筛选，不要一次刷全部。</li>
              <li>2. 先完成对应知识点，再做题，否则只是猜。</li>
              <li>3. 错题隔天重做；章节练习通过后进入周期复习。</li>
              <li>4. 用模拟笔试检查混合场景和速度。</li>
            </ol>
          </Panel>

          <div className="rounded-xl border border-white/[0.06] px-4 py-3 text-[10px] leading-5 text-muted/50">
            题目为原创编写，依据官方文档校验；参考 [权威来源](/sources)。题库练习不替代章节学习和周期复习。
          </div>
        </aside>
      </div>
    </div>
  );
}

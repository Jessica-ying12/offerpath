import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ExternalLink, ListChecks } from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { getCompletedAtomIds } from "@/lib/db/learning";
import { getChaptersForSkill, getSkill, getSkillCategory, getSkillName } from "@/lib/content";
import { CATEGORY_LABEL, LEVEL_LABEL, LEVELS, type LevelId } from "@/lib/content/schema";
import { percent } from "@/lib/utils";

export const metadata: Metadata = { title: "技术路径" };

export default async function TechnologyPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const user = await requireUser();
  const { skillId } = await params;
  const skill = getSkill(skillId);
  const chapters = getChaptersForSkill(skillId);
  if (!skill || chapters.length === 0) notFound();
  const db = getDb();
  const progressByTrack = new Map(
    [...new Set(chapters.map((entry) => entry.track.id))].map((trackId) => [
      trackId,
      getCompletedAtomIds(db, user.id, trackId),
    ]),
  );
  const allAtoms = chapters.flatMap((entry) => entry.chapter.atomIds);
  const completed = allAtoms.filter((atomId) => {
    const entry = chapters.find((candidate) => candidate.chapter.atomIds.includes(atomId));
    return entry ? progressByTrack.get(entry.track.id)?.has(atomId) : false;
  }).length;
  const category = getSkillCategory(skillId);
  const references = [
    ...new Map(
      chapters.flatMap((entry) =>
        entry.chapter.references.filter((reference) =>
          entry.chapter.atomIds.some((atomId) =>
            entry.track.atoms.find((atom) => atom.id === atomId)?.skills.includes(skillId),
          ),
        ).map((reference) => [reference.url, reference]),
      ),
    ).values(),
  ].slice(0, 5);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] text-muted">
        <Link href="/library" className="transition hover:text-paper">
          技术库
        </Link>
        <span>/</span>
        <span className="text-paper/70">{skill.name}</span>
      </div>
      <PageHeader
        eyebrow={`TECH PATH · ${CATEGORY_LABEL[category]}`}
        title={skill.name}
        description={`跨课程聚合 ${chapters.length} 个真实章节，按等级从基础到复杂依次学习，再用专项练习和周期复习验证掌握。`}
        actions={
          <Link href={`/bank?tech=${skill.id}`} className={buttonClass("primary", "md")}>
            <ListChecks className="h-4 w-4" />
            练这门技术
          </Link>
        }
      />

      <Panel className="mb-4 flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {skill.aliases.slice(0, 5).map((alias) => (
              <span key={alias} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[10px] text-muted">
                {alias}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-6 text-muted">
            学习顺序：{chapters.slice(0, 4).map((entry) => entry.chapter.title).join(" → ")}
            {chapters.length > 4 ? " → …" : ""}。每个章节都有知识点、练习题和参考来源。
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-xl text-lime">{percent(completed, allAtoms.length)}%</p>
            <p className="text-[10px] text-muted">技术路径完成</p>
          </div>
          <Progress value={completed} total={allAtoms.length} className="w-24" />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {LEVELS.map((level) => {
            const entries = chapters.filter((entry) => entry.chapter.level === level);
            if (entries.length === 0) return null;
            return (
              <section key={level}>
                <div className="mb-2 flex items-center gap-2">
                  <SectionLabel index={String(LEVELS.indexOf(level) + 1).padStart(2, "0")}>
                    {LEVEL_LABEL[level]}
                  </SectionLabel>
                  <span className="font-mono text-[9px] text-muted/40">{entries.length} 章</span>
                </div>
                <div className="space-y-2">
                  {entries.map(({ track, chapter, questions }) => {
                    const completedAtoms = chapter.atomIds.filter((atomId) =>
                      progressByTrack.get(track.id)?.has(atomId),
                    ).length;
                    const firstAtom = chapter.atomIds.find(
                      (atomId) => !progressByTrack.get(track.id)?.has(atomId),
                    ) ?? chapter.atomIds[0];
                    return (
                      <Panel key={chapter.id} className="overflow-hidden">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone="outline">{track.shortName}</Badge>
                              <span className="font-mono text-[9px] text-muted/40">
                                {completedAtoms}/3 知识点
                              </span>
                            </div>
                            <h2 className="mt-2 text-[15px] font-semibold text-paper">{chapter.title}</h2>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{chapter.summary}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {questions.slice(0, 3).map((question) => (
                                <span key={question.id} className="text-[9px] text-muted/45">
                                  #{getSkillName(track, question.skills[0] ?? skillId)}
                                </span>
                              ))}
                              <span className="font-mono text-[9px] text-lime/50">{questions.length} 道专项题</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/learn/${track.id}/${chapter.id}/${firstAtom}`}
                              className={buttonClass("primary", "sm")}
                            >
                              {completedAtoms > 0 ? "继续学习" : "开始"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                              href={`/bank?tech=${skill.id}&level=${level}`}
                              className={buttonClass("secondary", "sm")}
                              aria-label="练本技术题目"
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </Panel>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-lime" />
              <p className="text-[12px] font-medium text-paper">官方参考来源</p>
            </div>
            <div className="mt-3 space-y-2">
              {references.length > 0 ? (
                references.map((reference) => (
                  <a
                    key={reference.url}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-[11px] text-muted transition hover:border-lime/20 hover:text-paper"
                  >
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted/40 group-hover:text-lime" />
                    <span>
                      {reference.title}
                      <span className="mt-0.5 block text-[9px] text-muted/40">{reference.publisher}</span>
                    </span>
                  </a>
                ))
              ) : (
                <p className="text-[11px] text-muted/50">该技术章节暂无单独外链，见课程参考来源。</p>
              )}
            </div>
            <Link href="/sources" className="mt-3 inline-flex items-center gap-1 text-[10px] text-lime/70 hover:text-lime">
              查看全部来源
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">怎样算真正掌握</p>
            </div>
            <ol className="mt-3 space-y-2 text-[10px] leading-5 text-muted/70">
              <li>1. 完成技术路径中的知识点，不只收藏。</li>
              <li>2. 做对应章节练习，正确率 ≥ 60%。</li>
              <li>3. 按 D+1、D+3、D+7 完成三次复习，复习 ≥ 80%。</li>
              <li>4. 在模拟面试中把机制和取舍讲清楚。</li>
            </ol>
            <Link href="/review" className={buttonClass("secondary", "sm", "mt-4 w-full")}>
              查看周期复习
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>

          <div className="rounded-xl border border-white/[0.06] px-4 py-3 text-[10px] leading-5 text-muted/50">
            技术路径只展示真实章节。某技术章节少时，说明课程尚未覆盖完整，不用空链接充数。
          </div>
        </aside>
      </div>
    </div>
  );
}

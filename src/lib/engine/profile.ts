import type { LevelId, Skill, Track } from "@/lib/content/schema";
import { LEVEL_LABEL, LEVELS } from "@/lib/content/schema";
import type { SkillAnalysis } from "@/lib/types";

export type SkillHit = {
  skillId: string;
  name: string;
  hits: string[];
};

const ASCII_ONLY = /^[\x00-\x7F]+$/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\r/g, "").replace(/[ \t]+/g, " ");
}

export function aliasMatches(normalizedText: string, alias: string): boolean {
  const needle = alias.trim().toLowerCase();
  if (!needle) return false;
  if (ASCII_ONLY.test(needle)) {
    const pattern = new RegExp(
      `(^|[^a-z0-9+#])${escapeRegExp(needle)}($|[^a-z0-9+#])`,
      "i",
    );
    return pattern.test(normalizedText);
  }
  return normalizedText.includes(needle);
}

export function extractSkills(skills: Skill[], text: string): SkillHit[] {
  if (!text.trim()) return [];
  const normalized = normalizeText(text);
  const hits: SkillHit[] = [];
  for (const skill of skills) {
    const matched = skill.aliases.filter((alias) => aliasMatches(normalized, alias));
    if (matched.length > 0) {
      hits.push({ skillId: skill.id, name: skill.name, hits: matched });
    }
  }
  return hits;
}

export function coreSkillIds(track: Track, level: LevelId): string[] {
  const rank = LEVELS.indexOf(level);
  const eligible = new Set(LEVELS.slice(Math.max(0, rank - 1), rank + 1));
  const ids = new Set<string>();
  for (const chapter of track.chapters) {
    if (!eligible.has(chapter.level)) continue;
    for (const atomId of chapter.atomIds) {
      const atom = track.atoms.find((item) => item.id === atomId);
      atom?.skills.forEach((skill) => ids.add(skill));
    }
  }
  return [...ids];
}

export function analyseProfile(input: {
  track: Track;
  level: LevelId;
  resumeText: string;
  jdText: string;
}): SkillAnalysis {
  const { track, level, resumeText, jdText } = input;
  const resumeHits = extractSkills(track.skills, resumeText);
  const jdHits = extractSkills(track.skills, jdText);
  const resumeSkillIds = resumeHits.map((hit) => hit.skillId);
  const jdSkillIds = jdHits.map((hit) => hit.skillId);
  const requiredSkills =
    jdSkillIds.length >= 3 ? jdSkillIds.slice(0, 10) : coreSkillIds(track, level);
  const resumeSet = new Set(resumeSkillIds);
  const requiredSet = new Set(requiredSkills);
  const matchedSkills = requiredSkills.filter((id) => resumeSet.has(id));
  const gapSkills = requiredSkills.filter((id) => !resumeSet.has(id));
  const extraSkills = resumeSkillIds.filter((id) => !requiredSet.has(id)).slice(0, 8);
  const coverage = requiredSkills.length
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  const skillName = (id: string) => track.skills.find((skill) => skill.id === id)?.name ?? id;
  const evidenceMap = new Map<
    string,
    { skillId: string; name: string; sources: Array<"resume" | "jd">; hits: string[] }
  >();
  for (const hit of resumeHits) {
    evidenceMap.set(hit.skillId, {
      skillId: hit.skillId,
      name: hit.name,
      sources: ["resume"],
      hits: hit.hits,
    });
  }
  for (const hit of jdHits) {
    const existing = evidenceMap.get(hit.skillId);
    if (existing) {
      existing.sources = [...new Set([...existing.sources, "jd"] as Array<"resume" | "jd">)];
      existing.hits = [...new Set([...existing.hits, ...hit.hits])];
    } else {
      evidenceMap.set(hit.skillId, {
        skillId: hit.skillId,
        name: hit.name,
        sources: ["jd"],
        hits: hit.hits,
      });
    }
  }

  let summary: string;
  if (jdSkillIds.length > 0) {
    summary = `JD 识别出 ${jdSkillIds.length} 项相关技能，你已覆盖 ${matchedSkills.length}/${requiredSkills.length}。`;
    if (gapSkills.length) {
      summary += ` 优先补：${gapSkills.slice(0, 4).map(skillName).join("、")}。`;
    } else {
      summary += " 主要技能均有简历线索，重点是表达深度与项目追问。";
    }
  } else if (resumeSkillIds.length > 0) {
    summary = `未提供有效 JD，按${LEVEL_LABEL[level]}岗位核心技能评估；简历命中 ${resumeHits.length} 项技能。`;
    if (gapSkills.length) summary += ` 建议补齐：${gapSkills.slice(0, 4).map(skillName).join("、")}。`;
  } else {
    summary = "尚未识别到技能关键词，请补充简历或 JD 中的技术栈与项目描述，计划将按岗位核心技能生成。";
  }

  return {
    resumeSkills: resumeSkillIds,
    jdSkills: jdSkillIds,
    requiredSkills,
    matchedSkills,
    gapSkills,
    extraSkills,
    coverage,
    summary,
    evidence: [...evidenceMap.values()],
  };
}

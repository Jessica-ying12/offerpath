import { describe, expect, it } from "vitest";
import { getTracks } from "@/lib/content";
import { analyseProfile, coreSkillIds, extractSkills } from "@/lib/engine/profile";
import { buildCareerPlan, buildSprintPlan } from "@/lib/engine/plans";

const track = getTracks().find((item) => item.id === "fullstack")!;
const resume = `高级全栈工程师，4 年经验。
项目：订单履约平台（React + TypeScript + Node.js + PostgreSQL）
- 负责订单列表与详情，使用 React Query 管理服务端状态，P95 从 420ms 降到 180ms。
- 设计幂等下单与超时重试，修复重复支付；用 Redis 缓存热点商品。
- 使用 Vitest 写测试，GitHub Actions 部署到 Docker。`;
const jd = `全栈开发工程师（中级）
要求熟悉 React、TypeScript、Node.js，熟悉 PostgreSQL 索引与事务；
了解 Redis、Docker、CI/CD；有性能优化与线上故障排查经验。`;
const now = "2026-10-21T00:00:00.000Z";

describe("profile analysis", () => {
  it("extracts known skills from resume and JD", () => {
    const resumeHits = extractSkills(track.skills, resume).map((hit) => hit.skillId);
    expect(resumeHits).toContain("react-fundamentals");
    expect(resumeHits).toContain("typescript");
    expect(resumeHits).toContain("node-runtime");
    expect(resumeHits).toContain("sql-database");

    const analysis = analyseProfile({ track, level: "middle", resumeText: resume, jdText: jd });
    expect(analysis.jdSkills.length).toBeGreaterThanOrEqual(3);
    expect(analysis.matchedSkills.length).toBeGreaterThan(0);
    expect(analysis.requiredSkills.length).toBeGreaterThan(0);
    expect(analysis.coverage).toBeGreaterThanOrEqual(0);
    expect(analysis.coverage).toBeLessThanOrEqual(100);
    expect(analysis.summary).toContain("JD");
  });

  it("falls back to level core skills when no JD is provided", () => {
    const analysis = analyseProfile({ track, level: "junior", resumeText: resume, jdText: "" });
    const core = new Set(coreSkillIds(track, "junior"));
    expect(analysis.requiredSkills.every((skill) => core.has(skill))).toBe(true);
    expect(analysis.jdSkills).toEqual([]);
  });
});

describe("sprint plan", () => {
  it("builds a 3-day plan with lessons, practice, code and interview tasks", () => {
    const plan = buildSprintPlan({
      track,
      level: "middle",
      urgencyDays: 3,
      company: "示例公司",
      resumeText: resume,
      jdText: jd,
      now,
    });
    expect(plan.kind).toBe("sprint");
    expect(plan.days).toHaveLength(3);
    expect(plan.title).toContain("示例公司");
    expect(plan.selectedAtomIds.length).toBeGreaterThanOrEqual(9);
    expect(plan.challengeIds.length).toBeGreaterThanOrEqual(1);
    const tasks = plan.days.flatMap((day) => day.tasks);
    expect(tasks.some((task) => task.type === "atom")).toBe(true);
    expect(tasks.some((task) => task.type === "practice")).toBe(true);
    expect(tasks.some((task) => task.type === "code")).toBe(true);
    expect(tasks.some((task) => task.type === "interview")).toBe(true);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
    expect(plan.days.every((day) => day.tasks.length > 0)).toBe(true);
    const atomIds = new Set(track.atoms.map((atom) => atom.id));
    expect(plan.selectedAtomIds.every((atomId) => atomIds.has(atomId))).toBe(true);
    const chapterIds = new Set(track.chapters.map((chapter) => chapter.id));
    expect(plan.chapterIds.every((chapterId) => chapterIds.has(chapterId))).toBe(true);
  });

  it("keeps every task when distributing 14 days", () => {
    const plan = buildSprintPlan({
      track,
      level: "senior",
      urgencyDays: 14,
      company: "",
      resumeText: "",
      jdText: jd,
      now,
    });
    expect(plan.days).toHaveLength(14);
    const tasks = plan.days.flatMap((day) => day.tasks);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
    expect(tasks.filter((task) => task.type === "interview")).toHaveLength(1);
  });
});

describe("career plan", () => {
  it("allocates the chosen horizon across levels and a sprint phase", () => {
    const plan = buildCareerPlan({
      track,
      level: "senior",
      horizonWeeks: 12,
      company: "",
      resumeText: resume,
      jdText: jd,
      now,
    });
    expect(plan.kind).toBe("career");
    expect(plan.phases.map((phase) => phase.level)).toEqual(["junior", "middle", "senior", "senior"]);
    expect(plan.phases[plan.phases.length - 1].id).toBe("phase-sprint");
    expect(plan.phases.reduce((sum, phase) => sum + phase.weeks, 0)).toBe(12);
    expect(plan.phases.every((phase) => phase.weeks >= 1)).toBe(true);
    expect(plan.skillCoverage.length).toBeGreaterThan(0);
    const allAtoms = plan.phases.flatMap((phase) => phase.atomIds);
    expect(allAtoms.length).toBe(track.chapters.length * 3);
  });

  it("builds a compact 4-week route for a junior target", () => {
    const plan = buildCareerPlan({
      track,
      level: "junior",
      horizonWeeks: 4,
      company: "目标公司",
      resumeText: "",
      jdText: "",
      now,
    });
    expect(plan.phases).toHaveLength(2);
    expect(plan.phases[1].id).toBe("phase-sprint");
    expect(plan.phases.reduce((sum, phase) => sum + phase.weeks, 0)).toBe(4);
  });
});

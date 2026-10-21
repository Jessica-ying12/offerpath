import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COURSE_EXPECTATIONS,
  TRACK_IDS,
  interviewBankSchema,
  qualityWarnings,
  trackSchema,
  validateInterviewBank,
  validateTrack,
} from "../src/lib/content/schema";

const root = process.cwd();
let failed = false;
let totalQuestions = 0;

for (const trackId of TRACK_IDS) {
  const trackPath = join(root, "data", "curriculum", `${trackId}.json`);
  try {
    const track = trackSchema.parse(JSON.parse(readFileSync(trackPath, "utf8")));
    const problems = validateTrack(track);
    if (track.id !== trackId) problems.push(`文件 ${trackId} 内部 trackId 不一致`);
    totalQuestions += track.questions.length;
    if (problems.length) {
      failed = true;
      console.error(`\n✗ ${trackId} 内容校验失败:`);
      for (const problem of problems) console.error("  -", problem);
    } else {
      console.log(
        `✓ ${trackId}：${track.chapters.length} 章 / ${track.atoms.length} 知识点 / ${track.questions.length} 题 / ${track.codeChallenges.length} 代码题`,
      );
    }
    for (const warning of qualityWarnings(track)) console.warn("  ! 质量提醒:", warning);

    const bankPath = join(root, "data", "interviews", `${trackId}.json`);
    if (COURSE_EXPECTATIONS[trackId].hasInterviewBank) {
      if (!existsSync(bankPath)) {
        failed = true;
        console.error(`✗ ${trackId} 面试题库缺失`);
        continue;
      }
      const bank = interviewBankSchema.parse(JSON.parse(readFileSync(bankPath, "utf8")));
      const bankProblems = validateInterviewBank(
        bank,
        new Set(track.skills.map((skill) => skill.id)),
      );
      if (bankProblems.length) {
        failed = true;
        console.error(`✗ ${trackId} 面试题校验失败:`);
        for (const problem of bankProblems) console.error("  -", problem);
      } else {
        console.log(`✓ ${trackId} 面试题：${bank.questions.length} 道`);
      }
    } else {
      console.log(`· ${trackId}：本课程暂无模拟面试题库（练习专项）`);
    }
  } catch (error) {
    failed = true;
    console.error(`✗ ${trackId} 解析失败:`, error instanceof Error ? error.message : error);
  }
}

if (totalQuestions < 200) {
  failed = true;
  console.error(`✗ 题库总量不足 200，当前 ${totalQuestions}`);
} else {
  console.log(`\n题库总量：${totalQuestions} 道选择题`);
}

if (failed) process.exit(1);
console.log("全部内容校验通过。");

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsDir = path.join(root, "content", "docs");
const qaDir = path.join(root, "content", "qa");
const docs = fs.readdirSync(docsDir).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const qa = fs.readdirSync(qaDir).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const errors = [];

if (docs.length !== 21) errors.push(`精读文档应为 21 篇，实际 ${docs.length}`);
if (qa.length !== 21) errors.push(`问答分册应为 21 份，实际 ${qa.length}`);

let questions = 0;
let followUps = 0;
let traps = 0;
const forbidden = ["彭莹", "Sylvia", "Gissele", "ExploreX", "LivHome", "LIVPET", "com.explorex"];
for (const file of docs) {
  const text = fs.readFileSync(path.join(docsDir, file), "utf8");
  if (!/^#\s+\S+/m.test(text)) errors.push(`${file} 缺少一级标题`);
  for (const marker of forbidden) {
    if (text.includes(marker)) errors.push(`${file} 含有个人/公司信息：${marker}`);
  }
}
for (const file of qa) {
  const text = fs.readFileSync(path.join(qaDir, file), "utf8");
  const count = (text.match(/^##\s+Q\d+\./gm) ?? []).length;
  questions += count;
  followUps += (text.match(/^\*\*追问\s+\d+/gm) ?? []).length;
  traps += (text.match(/^\*\*陷阱\/加分/gm) ?? []).length;
  if (count === 0) errors.push(`${file} 没有解析到 Q&A`);
  for (const marker of forbidden) {
    if (text.includes(marker)) errors.push(`${file} 含有个人/公司信息：${marker}`);
  }
}
if (questions !== 380) errors.push(`面试问答应为 380 道，实际 ${questions}`);
if (traps < 379) errors.push(`陷阱/加分条目异常：${traps}`);

const bank = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "question-bank.json"), "utf8"));
const bankTotal = bank.questions.length;
const requiredTypes = ["short", "fill", "boolean", "multiple", "single"];
const bankCounts = bank.counts ?? {};
for (const type of requiredTypes) {
  if (!bankCounts[type]) errors.push(`题库缺少题型：${type}`);
}
if (bankTotal < 2000) errors.push(`题库总量应 ≥ 2000，实际 ${bankTotal}`);
for (const question of bank.questions) {
  const text = JSON.stringify(question);
  for (const marker of forbidden) {
    if (text.includes(marker)) errors.push(`题库含个人/公司信息：${marker}`);
  }
}
const docsWithBank = new Set(bank.questions.map((question) => question.docId).filter(Boolean));
for (const docId of docs.map((file) => file.slice(0, 2))) {
  if (docId !== "09" && !docsWithBank.has(docId)) errors.push(`知识点 ${docId} 没有对应题目`);
}

console.log(`精读：${docs.length} 篇`);
console.log(`问答：${qa.length} 份 / ${questions} 道 / ${followUps} 层追问 / ${traps} 个陷阱提示`);
console.log(`题库：${bankTotal} 道 / ${requiredTypes.map((type) => `${type} ${bankCounts[type] ?? 0}`).join(" / ")}`);
if (errors.length > 0) {
  console.error("\n校验失败：");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("内容校验通过，未包含简历定制个人数据。");

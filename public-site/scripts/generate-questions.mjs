import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const qaDir = path.join(root, "content", "qa");
const docDir = path.join(root, "content", "docs");
const curriculumDir = path.join(root, "src", "data", "curriculum");
const outFile = path.join(root, "src", "data", "question-bank.json");

const qaToDoc = {
  "01": "01", "02": "02", "03": "03", "04": "04", "05": "05",
  "06": "05", "07": "06", "08": "07", "09": "08", "10": "10",
  "11": "11", "12": "12", "13": "13", "14": "14", "15": "15",
  "16": "16", "17": "17", "18": "18", "19": "19", "20": "20", "21": "21",
};

const docTitles = new Map();
for (const file of fs.readdirSync(docDir)) {
  const match = file.match(/^(\d{2})-(.+)\.md$/);
  if (!match) continue;
  const content = fs.readFileSync(path.join(docDir, file), "utf8");
  docTitles.set(match[1], content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? match[2]);
}

function clean(text) {
  return text
    .replace(/^>\s?/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();
}

function sentences(text) {
  return clean(text)
    .replace(/```[\s\S]*?```/g, "")
    .split(/(?<=[。；;])|\n+/)
    .map((part) => part.trim().replace(/[。；;]$/, ""))
    .filter((part) => part.length >= 10 && part.length <= 220);
}

function keyPoints(text) {
  const seen = new Set();
  return sentences(text)
    .filter((part) => {
      if (seen.has(part)) return false;
      seen.add(part);
      return !part.startsWith("```");
    })
    .slice(0, 5);
}

function parseQa(markdown) {
  const sections = markdown.split(/^##\s+Q(\d+)\.\s*(.+)$/gm);
  const items = [];
  for (let index = 1; index < sections.length; index += 3) {
    const number = Number(sections[index]);
    const question = (sections[index + 1] ?? "").trim();
    const body = sections[index + 2] ?? "";
    const direct =
      body.match(/\*\*直接回答[^*]*\*\*\s*\n+([\s\S]*?)(?=\n\*\*追问\s|\n\*\*陷阱|\n---|$)/)?.[1]?.trim() ?? "";
    const followUps = [];
    const regex = /\*\*追问\s*(\d+)：(.+?)\*\*\s*\n+([\s\S]*?)(?=\n\*\*追问\s|\n\*\*陷阱|\n---|$)/g;
    for (const match of body.matchAll(regex)) {
      followUps.push({ number: Number(match[1]), question: match[2].trim(), answer: match[3].trim() });
    }
    const trap = body.match(/\*\*陷阱\/加分[^*]*\*\*\s*\n+([\s\S]*?)(?=\n---|$)/)?.[1]?.trim() ?? "";
    if (question && direct) items.push({ number, question, direct, followUps, trap });
  }
  return items;
}

const qaFiles = fs.readdirSync(qaDir).filter((file) => /^\d{2}-.+\.md$/.test(file)).sort();
const questions = [];
let counter = 0;

for (const file of qaFiles) {
  const prefix = file.slice(0, 2);
  const docId = qaToDoc[prefix] ?? prefix;
  const docTitle = docTitles.get(docId) ?? prefix;
  const allItems = parseQa(fs.readFileSync(path.join(qaDir, file), "utf8"));
  for (const item of allItems) {
    const pts = keyPoints(item.direct);
    if (!pts.length) continue;
    questions.push({
      id: `short-${prefix}-q${item.number}-main`,
      type: "short",
      stage: "main",
      docId,
      docTitle,
      section: `Q${item.number}`,
      prompt: item.question,
      modelAnswer: item.direct,
      keyPoints: pts,
      explanation: item.trap || "对照参考答案，检查结论、机制和边界是否完整。",
      difficulty: pts.length >= 3 ? 2 : 1,
      source: `qa-${prefix}-q${item.number}`,
    });
    for (const follow of item.followUps) {
      const fpts = keyPoints(follow.answer);
      if (!fpts.length) continue;
      questions.push({
        id: `short-${prefix}-q${item.number}-f${follow.number}`,
        type: "short",
        stage: "followup",
        docId,
        docTitle,
        section: `Q${item.number} · 追问${follow.number}`,
        prompt: follow.question,
        modelAnswer: follow.answer,
        keyPoints: fpts,
        explanation: "这是主问题的追问，答案应与主问题形成机制上的递进。",
        difficulty: 3,
        source: `qa-${prefix}-q${item.number}-f${follow.number}`,
      });
    }
  }

  for (const item of allItems) {
    const terms = [...new Set([...item.direct.matchAll(/`([^`\n]{2,26})`/g)].map((match) => match[1].trim()))]
      .filter((term) => !/[{}]/.test(term) && !term.includes("http"));
    const usedPrompts = new Set();
    for (const term of terms) {
      const sentence = sentences(item.direct).find((part) => part.includes(term));
      if (!sentence) continue;
      const prompt = sentence.replace(term, "____");
      if (!prompt.includes("____") || usedPrompts.has(prompt)) continue;
      usedPrompts.add(prompt);
      questions.push({
        id: `fill-${prefix}-q${item.number}-${questions.length}`,
        type: "fill",
        stage: "main",
        docId,
        docTitle,
        section: `Q${item.number}`,
        prompt: `补全关键术语：${prompt}`,
        answers: [[term, term.replace(/\s+/g, "")]],
        modelAnswer: item.direct,
        explanation: item.direct,
        difficulty: 1,
        source: `qa-${prefix}-q${item.number}`,
      });
      if (usedPrompts.size >= 2) break;
    }
  }
}

const fillByDoc = new Map();
for (const question of questions.filter((item) => item.type === "fill")) {
  if (!fillByDoc.has(question.docId)) fillByDoc.set(question.docId, []);
  fillByDoc.get(question.docId).push(question);
}
for (const question of questions.filter((item) => item.type === "fill")) {
  const term = question.answers[0][0];
  const sentence = question.prompt.replace(/^补全关键术语：/, "");
  const alternatives = (fillByDoc.get(question.docId) ?? [])
    .filter((other) => other.answers[0][0] !== term && !sentence.includes(other.answers[0][0]))
    .map((other) => other.answers[0][0]);
  const makeFalse = counter++ % 2 === 0 && alternatives.length > 0;
  const shown = makeFalse ? sentence.replace("____", alternatives[0]) : sentence.replace("____", term);
  questions.push({
    id: `boolean-${question.id}`,
    type: "boolean",
    stage: "main",
    docId: question.docId,
    docTitle: question.docTitle,
    section: question.section,
    prompt: `判断对错：${shown}`,
    answer: !makeFalse,
    modelAnswer: sentence.replace("____", term),
    explanation: `${makeFalse ? "该说法替换了关键术语。" : "该说法与参考答案一致。"}正确表述：${sentence.replace("____", term)}。\n\n${question.explanation}`,
    difficulty: 1,
    source: question.source,
  });
}

for (const [docId, title] of docTitles) {
  const candidates = questions.filter(
    (question) =>
      question.type === "short" &&
      question.stage === "main" &&
      question.docId === docId &&
      question.keyPoints.length >= 2,
  );
  if (candidates.length < 2) continue;
  for (let index = 0; index < Math.min(3, candidates.length); index += 1) {
    const correct = candidates[index];
    const other = candidates.find((item) => item.id !== correct.id);
    if (!other) continue;
    const correctOptions = correct.keyPoints.slice(0, 2);
    const wrongOptions = other.keyPoints.slice(0, 2).filter((point) => !correctOptions.includes(point));
    while (wrongOptions.length < 2) wrongOptions.push(`以上都不是：${wrongOptions.length + 1}`);
    const options = [...correctOptions, ...wrongOptions.slice(0, 2)];
    if ((index + correct.id.length) % 2 === 0) options.reverse();
    questions.push({
      id: `multi-${docId}-${index + 1}`,
      type: "multiple",
      stage: "main",
      docId,
      docTitle: title,
      section: correct.section,
      prompt: `关于「${correct.prompt}」，以下哪些说法属于本题参考答案的要点？（多选）`,
      options,
      answerIndices: correctOptions.map((point) => options.indexOf(point)).sort((a, b) => a - b),
      modelAnswer: correct.modelAnswer,
      explanation: correct.modelAnswer,
      difficulty: 2,
      source: correct.source,
    });
  }
}

// One single-choice question per main Q&A, aligned to its knowledge document.
for (const [docId, title] of docTitles) {
  const pool = questions.filter(
    (question) => question.type === "short" && question.stage === "main" && question.docId === docId,
  );
  pool.forEach((correct, index) => {
    const distractors = pool
      .filter((item) => item.id !== correct.id)
      .map((item) => item.keyPoints?.[0])
      .filter((point) => point && point !== correct.keyPoints?.[0])
      .slice(0, 3);
    if (!correct.keyPoints?.[0] || distractors.length < 3) return;
    const options = [correct.keyPoints[0], ...distractors];
    const offset = (index + correct.id.length) % 4;
    const rotated = [...options.slice(offset), ...options.slice(0, offset)];
    questions.push({
      id: `single-${docId}-${index + 1}`,
      type: "single",
      stage: "main",
      docId,
      docTitle: title,
      section: correct.section,
      prompt: `关于「${correct.prompt}」，以下哪一项最接近本题参考答案的第一条要点？`,
      options: rotated,
      answerIndex: rotated.indexOf(correct.keyPoints[0]),
      modelAnswer: correct.modelAnswer,
      explanation: correct.modelAnswer,
      difficulty: 1,
      source: correct.source,
    });
  });
}

const courseFiles = [
  ["mobile", "移动端开发"],
  ["fullstack", "全栈开发"],
  ["backend-java", "Java 后端"],
  ["database-mysql", "MySQL"],
  ["cs-ai-foundations", "计算机基础与 AI"],
];
for (const [file, courseName] of courseFiles) {
  const track = JSON.parse(fs.readFileSync(path.join(curriculumDir, `${file}.json`), "utf8"));
  for (const question of track.questions) {
    const chapter = track.chapters.find((item) => item.id === question.chapterId);
    questions.push({
      id: `course-${question.id}`,
      type: "single",
      stage: "course",
      docId: null,
      docTitle: null,
      courseId: track.id,
      courseName,
      chapterTitle: chapter?.title ?? "",
      section: chapter?.title ?? "",
      prompt: question.prompt,
      options: question.options,
      answerIndex: question.answerIndex,
      modelAnswer: question.options[question.answerIndex],
      explanation: question.explanation,
      difficulty: question.level === "senior" ? 3 : question.level === "middle" ? 2 : 1,
      source: `curriculum-${file}`,
    });
  }
}

const counts = questions.reduce((acc, question) => {
  acc[question.type] = (acc[question.type] ?? 0) + 1;
  return acc;
}, {});
const byDoc = {};
for (const question of questions) {
  if (!question.docId) continue;
  if (!byDoc[question.docId]) {
    byDoc[question.docId] = { total: 0, types: {} };
  }
  byDoc[question.docId].total += 1;
  byDoc[question.docId].types[question.type] = (byDoc[question.docId].types[question.type] ?? 0) + 1;
}
fs.writeFileSync(
  outFile,
  JSON.stringify({ generatedAt: new Date().toISOString(), counts, byDoc, questions }, null, 2),
);
fs.writeFileSync(
  path.join(root, "src", "data", "question-meta.json"),
  JSON.stringify({ total: questions.length, counts, byDoc }, null, 2),
);
console.log("生成题库：", counts, "总计", questions.length);
console.log("输出：", outFile);

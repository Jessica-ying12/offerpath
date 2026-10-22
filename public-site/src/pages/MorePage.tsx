import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Github,
  Layers3,
  MessageSquareQuote,
  Moon,
  Route,
  RotateCcw,
  Sun,
} from "lucide-react";
import { DOCS, TOTAL_QA } from "../lib/content";
import questionMeta from "../data/question-meta.json";
import { useStore } from "../lib/store";
import { PageContainer, PageHeader } from "../components/ui";
import meta from "../data/question-meta.json";

const LINKS = [
  { href: "/roadmap", label: "路线图库", desc: "入门 / 职业 / 技术路线与完整节点", icon: Route },
  { href: "/plan", label: "学习计划", desc: "按目标生成模块、任务与进度", icon: Route },
  { href: "/review", label: "周期复习", desc: "D+1 / D+3 / D+7 到期问答", icon: RotateCcw },
  { href: "/progress", label: "学习进度与备份", desc: "掌握度、记录、导出 JSON", icon: BarChart3 },
  { href: "/docs", label: "深度文档", desc: "21 篇精读与全文检索", icon: BookOpen },
  { href: "/qa", label: "面试自测", desc: `${TOTAL_QA} 道直接回答 + 追问`, icon: MessageSquareQuote },
  { href: "/quiz", label: "题库练习", desc: `${meta.total} 道五种题型与逐题纠正`, icon: Layers3 },
  { href: "/profile", label: "用户与数据", desc: "本机多用户、目标岗位与备份", icon: Route },
];

export function MorePage() {
  const { state, setTheme, completedDocs, masteredQa, dueQa } = useStore();
  return (
    <PageContainer>
      <PageHeader
        eyebrow="MORE · SETTINGS"
        title="更多"
        description="学习入口、阅读设置与本机数据。平台不登录、不收集阅读记录。"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              to={link.href}
              className="card group flex items-center gap-3 p-4 transition hover:border-accent/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised text-accent">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">{link.label}</span>
                <span className="mt-0.5 block text-[10px] text-muted">{link.desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:text-accent" />
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <p className="eyebrow mb-3">APPEARANCE</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-ink">阅读主题</p>
              <p className="mt-0.5 text-[10px] text-muted">长篇阅读建议浅色，夜间切换深色。</p>
            </div>
            <div className="flex gap-1 rounded-xl border border-line/10 p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] ${
                  state.theme === "light" ? "bg-raised font-semibold text-ink" : "text-muted"
                }`}
              >
                <Sun className="h-3 w-3" /> 浅色
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] ${
                  state.theme === "dark" ? "bg-raised font-semibold text-ink" : "text-muted"
                }`}
              >
                <Moon className="h-3 w-3" /> 深色
              </button>
            </div>
          </div>
          <p className="mt-3 text-[9.5px] leading-5 text-muted/70">
            字号和行高可在任意精读页顶部调整，会记住你的选择。
          </p>
        </section>

        <section className="card p-5">
          <p className="eyebrow mb-3">THIS DEVICE</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-raised/60 py-3">
              <p className="font-display text-[20px] font-bold text-ink">{completedDocs}/{DOCS.length}</p>
              <p className="text-[9px] text-muted">精读完成</p>
            </div>
            <div className="rounded-xl bg-raised/60 py-3">
              <p className="font-display text-[20px] font-bold text-ink">{masteredQa}</p>
              <p className="text-[9px] text-muted">问答掌握</p>
            </div>
            <div className="rounded-xl bg-raised/60 py-3">
              <p className="font-display text-[20px] font-bold text-coral">{dueQa}</p>
              <p className="text-[9px] text-muted">待复习</p>
            </div>
          </div>
          <Link to="/progress" className="mt-3 inline-flex items-center gap-1 text-[10px] text-accent">
            导出 / 导入数据 <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-line/10 bg-surface p-5">
        <p className="eyebrow mb-2">路线与资料来源</p>
        <p className="text-[10px] leading-5 text-muted">
          路线阶段参考 roadmap.sh，具体知识边界以官方文档为准；题目和精读为本平台基于你的学习包重新编排。
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            ["roadmap.sh Frontend", "https://roadmap.sh/frontend"],
            ["roadmap.sh React Native", "https://roadmap.sh/react-native"],
            ["roadmap.sh Backend", "https://roadmap.sh/backend"],
            ["MDN", "https://developer.mozilla.org/zh-CN/docs/Web"],
            ["React", "https://react.dev/learn"],
            ["React Native", "https://reactnative.dev/docs/getting-started"],
            ["微信小程序", "https://developers.weixin.qq.com/miniprogram/dev/framework/"],
            ["TypeScript", "https://www.typescriptlang.org/docs/"],
            ["Spring", "https://spring.io/guides"],
            ["MySQL", "https://dev.mysql.com/doc/refman/8.4/en/"],
          ].map(([label, url]) => (
            <a key={url} href={url} target="_blank" rel="noreferrer noopener" className="chip hover:border-accent/30">
              {label} ↗
            </a>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line/10 bg-raised/25 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface font-display text-[16px] font-bold text-accent">
            跃
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink">职跃 · 深度学习站</p>
            <p className="mt-1 text-[10px] leading-5 text-muted">
              21 篇精读、{TOTAL_QA} 道面试问答、{questionMeta.total} 道练习题。内容来自你的移动前端学习包，平台增加检索、
              目录、清单、笔记、自测与周期复习。所有学习记录保存在本机浏览器。
            </p>
            <p className="mt-2 rounded-lg bg-surface/70 px-2.5 py-2 text-[9px] leading-5 text-muted/70">
              公开站只收录通用知识与问答。含公司、项目指标和个人经历的「简历定制」文档未发布到公网，避免泄露。
            </p>
            <a
              href="https://github.com/Jessica-ying12/offerpath"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent"
            >
              <Github className="h-3 w-3" /> 查看源码与部署说明
            </a>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

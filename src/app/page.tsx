import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Layers,
  MessagesSquare,
  Mic,
  Route,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Badge, buttonClass, Panel } from "@/components/ui/primitives";
import { getInterviewBank, getTrackStats, getTracks } from "@/lib/content";
import { LEVEL_LABEL } from "@/lib/content/schema";

const MODES = [
  {
    index: "01",
    title: "系统学习",
    description: "基础薄弱也别硬啃长文。3 分钟一个点，学完立刻做题，每章都有练习。",
    href: "/learn",
    icon: BookOpen,
  },
  {
    index: "02",
    title: "急冲计划",
    description: "上传简历和目标 JD，抽取技能缺口，生成每天可执行的知识点、题和代码任务。",
    href: "/sprint",
    icon: Zap,
    highlight: true,
  },
  {
    index: "03",
    title: "职业规划",
    description: "想转岗或长期进阶？按目标等级拆成阶段路线，每一阶段都有验收标准。",
    href: "/career",
    icon: Route,
  },
  {
    index: "04",
    title: "模拟面试",
    description: "从简历项目开问。答错给提示和参考答案，答得好继续追问，最后出报告。",
    href: "/interview",
    icon: MessagesSquare,
  },
];

const LOOP = [
  { title: "学", copy: "3–6 分钟微课" },
  { title: "练", copy: "章节练习 + 代码" },
  { title: "错", copy: "记下错误与次数" },
  { title: "面", copy: "追问与参考表达" },
  { title: "录", copy: "形成个人证据链" },
];

export default function LandingPage() {
  const tracks = getTracks();
  const totals = tracks.reduce(
    (acc, track) => {
      const stats = getTrackStats(track);
      acc.atoms += stats.atoms;
      acc.questions += stats.questions;
      acc.challenges += stats.challenges;
      acc.interviews += getInterviewBank(track.id).questions.length;
      return acc;
    },
    { atoms: 0, questions: 0, challenges: 0, interviews: 0 },
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[840px] bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-lime/[0.065] blur-[130px]" />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:py-7">
        <Brand />
        <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex" aria-label="首页导航">
          <a href="#paths" className="transition hover:text-paper">
            学习方向
          </a>
          <a href="#modes" className="transition hover:text-paper">
            使用方式
          </a>
          <a href="#loop" className="transition hover:text-paper">
            训练闭环
          </a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
            登录
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            开始练习
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-8 lg:pb-24 lg:pt-20">
          <div className="animate-rise">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_10px_rgba(201,245,106,0.8)]" />
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                MOBILE / FULLSTACK · 三级路径
              </span>
            </div>

            <h1 className="text-balance text-[44px] font-semibold leading-[1.08] tracking-[-0.045em] text-paper sm:text-[58px] lg:text-[62px]">
              把求职，
              <br />
              拆成<span className="relative whitespace-nowrap text-lime">
                今天能完成
                <svg
                  className="absolute -bottom-1 left-0 h-2 w-full text-lime/35"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M1 6C50 2 150 1 199 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
              <br />
              的一小步。
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted">
              微课 5 分钟、练习一套、面试一轮。基础弱就系统学；时间紧就用简历和 JD
              生成专属清单。每一次学习、错误、重做和面试都会留下记录。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonClass("primary", "lg")}>
                开始免费使用
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login?demo=1" className={buttonClass("secondary", "lg")}>
                用演示账号体验
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted/70">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lime" />
                移动端 + 全栈
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lime" />
                初中高三级
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lime" />
                记录可回看
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[460px] animate-rise [animation-delay:120ms]">
            <div className="absolute -inset-6 rounded-[34px] bg-lime/[0.035] blur-2xl" aria-hidden="true" />

            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.1] bg-ink-800/95 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime" />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
                    TONIGHT · 45 MIN
                  </span>
                </div>
                <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[9px] text-muted">
                  SPRINT / 03
                </span>
              </div>

              <div className="px-5 pb-5 pt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-muted">今晚只做三件事</p>
                    <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.02em] text-paper">
                      面试前的状态管理
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl text-lime">1/3</span>
                    <p className="mt-0.5 text-[10px] text-muted">已完成</p>
                  </div>
                </div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full w-1/3 rounded-full bg-lime" />
                </div>

                <div className="mt-6 space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-3.5 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint/15 text-mint">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-muted line-through decoration-white/20">
                        Compose 状态与重组
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] text-muted/50">MICRO LESSON · 4 MIN</p>
                    </div>
                    <span className="font-mono text-[10px] text-muted/50">DONE</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-lime/25 bg-lime/[0.055] px-3.5 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-lime">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-paper">章节练习 · 5 题</p>
                      <p className="mt-0.5 font-mono text-[9px] text-lime/70">IN PROGRESS · 3/5</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-lime" />
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-3.5 py-3 opacity-75">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15">
                      <Mic className="h-3 w-3 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-muted">模拟追问：为什么重组会扩散？</p>
                      <p className="mt-0.5 font-mono text-[9px] text-muted/50">INTERVIEW · 8 MIN</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime/15 text-lime">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] font-medium text-paper/80">面试官 · 追问</span>
                    <Badge tone="outline" className="ml-auto text-[9px]">
                      中等
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-5 text-muted">
                    “你说状态提升能减少重组——那为什么把 State 放到父级反而可能让更多组件重组？”
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-ink-900/80 px-4 py-3">
              <p className="font-mono text-[9px] tracking-[0.12em] text-muted/60">
                EVERY ACTION LEAVES A RECORD
              </p>
              <span className="flex items-center gap-1 text-[10px] text-lime">
                可解释匹配
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-2 divide-x divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] sm:grid-cols-4">
            {[
              ["02", "首发方向", "移动端 / 全栈"],
              [String(totals.atoms), "微课", "3–6 分钟一节"],
              [String(totals.questions), "道笔试练习", "每章 5 题"],
              [String(totals.interviews), "道面试题", "含追问与参考"],
            ].map(([value, label, hint], index) => (
              <div key={label} className={index > 1 ? "col-span-1 px-5 py-5 sm:py-6" : "px-5 py-5 sm:py-6"}>
                <div className="font-mono text-[24px] leading-none text-paper">{value}</div>
                <div className="mt-2 text-[12px] font-medium text-paper/70">{label}</div>
                <div className="mt-1 text-[10px] text-muted/60">{hint}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="paths" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-20 pt-20 sm:px-8">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="eyebrow mb-3 text-lime/80">01 / TRACKS</div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-paper sm:text-[34px]">
                先把两条路走透。
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-6 text-muted">
              每个方向 3 个等级 × 3 个章节，章节内是微课，章节后是练习与代码题。等级不是标签，考察深度真的不同。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tracks.map((track) => {
              const Icon = track.id === "mobile" ? Smartphone : Layers;
              const stats = getTrackStats(track);
              return (
                <Link
                  key={track.id}
                  href={`/learn/${track.id}`}
                  className="group relative overflow-hidden rounded-card border border-white/[0.08] bg-ink-800/55 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-lime/25 hover:bg-ink-800 sm:p-7"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime/[0.04] blur-2xl transition group-hover:bg-lime/[0.08]" />
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-lime">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted/50">
                      {String(stats.chapters).padStart(2, "0")} CHAPTERS
                    </span>
                  </div>

                  <h3 className="mt-6 text-[21px] font-semibold tracking-[-0.02em] text-paper">
                    {track.name}
                  </h3>
                  <p className="mt-2 max-w-md text-[13px] leading-6 text-muted">{track.tagline}</p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {track.levels.map((level) => (
                      <Badge key={level.id} tone={level.id === "senior" ? "lime" : "default"}>
                        {LEVEL_LABEL[level.id]}
                      </Badge>
                    ))}
                    {track.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-white/[0.07] px-2.5 py-1 text-[11px] text-muted"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="font-mono text-[10px] text-muted/60">
                      {stats.atoms} 微课 · {stats.questions} 题 · {stats.challenges} 代码题
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-paper transition group-hover:text-lime">
                      进入方向
                      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="modes" className="relative scroll-mt-20 border-y border-white/[0.06] bg-white/[0.018] py-20">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="eyebrow mb-3 text-lime/80">02 / WAYS IN</div>
                <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-paper sm:text-[34px]">
                  时间不同，走法不同。
                </h2>
              </div>
              <p className="max-w-md text-[13px] leading-6 text-muted">
                同一套内容资产，按你的时间压力重新排列。三天和十二周，不该用同一张学习表。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Link
                    key={mode.index}
                    href={mode.href}
                    className={`group relative flex min-h-[240px] flex-col rounded-card border p-5 transition duration-300 hover:-translate-y-0.5 ${
                      mode.highlight
                        ? "border-lime/25 bg-lime/[0.045] hover:bg-lime/[0.065]"
                        : "border-white/[0.07] bg-ink-900/60 hover:border-white/15 hover:bg-ink-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-[0.16em] text-muted/50">
                        {mode.index}
                      </span>
                      <Icon
                        className={`h-[18px] w-[18px] ${mode.highlight ? "text-lime" : "text-muted/70"}`}
                        strokeWidth={1.7}
                      />
                    </div>
                    <h3 className="mt-6 text-[17px] font-semibold text-paper">{mode.title}</h3>
                    <p className="mt-2.5 text-[12px] leading-6 text-muted">{mode.description}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[11px] font-medium text-paper/70 transition group-hover:text-lime">
                      查看
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="loop" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="eyebrow mb-3 text-lime/80">03 / THE LOOP</div>
              <h2 className="text-balance text-[28px] font-semibold tracking-[-0.03em] text-paper sm:text-[36px]">
                不是看完，
                <br />
                是留下可复用的证据。
              </h2>
              <p className="mt-5 max-w-md text-[13px] leading-7 text-muted">
                每一次微课完成、每一道错题、每一次重做、每一轮面试回答都会进入你的记录。下一次计划会基于这些真实状态，而不是一个空白的进度条。
              </p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/[0.06] px-3.5 py-2 text-[11px] text-amber">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                面试评估按要点覆盖与表达完整度计算，仅供参考
              </div>
            </div>

            <Panel className="overflow-hidden p-0">
              <div className="grid grid-cols-5 divide-x divide-white/[0.06]">
                {LOOP.map((step, index) => (
                  <div key={step.title} className="relative px-2 py-6 text-center sm:px-3">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-lime/20 bg-lime/[0.06] font-mono text-[13px] text-lime">
                      {step.title}
                    </div>
                    <p className="mt-3 text-[9px] leading-4 text-muted sm:text-[10px]">{step.copy}</p>
                    {index < LOOP.length - 1 ? (
                      <span className="absolute right-0 top-[38px] hidden h-px w-2 translate-x-1/2 bg-lime/30 sm:block" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-muted/60">PERSONAL LOG · WEEK 02</p>
                  <Badge tone="mint">连续 5 天</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-mono text-lg text-paper">12</p>
                    <p className="mt-0.5 text-[10px] text-muted">微课完成</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-paper">78%</p>
                    <p className="mt-0.5 text-[10px] text-muted">练习正确率</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-paper">3</p>
                    <p className="mt-0.5 text-[10px] text-muted">面试复盘</p>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
          <div className="relative overflow-hidden rounded-[26px] border border-lime/20 bg-lime/[0.055] px-6 py-12 sm:px-10 lg:px-14">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <div className="eyebrow mb-4 text-lime/80">START SMALL. THEN COMPOUND.</div>
                <h2 className="text-balance text-[30px] font-semibold leading-[1.2] tracking-[-0.035em] text-paper sm:text-[40px]">
                  先完成第一步，
                  <br />
                  剩下的会有路径。
                </h2>
                <p className="mt-4 max-w-lg text-[13px] leading-7 text-muted">
                  注册后选择方向和等级，三十秒进入第一节微课。也可以直接用演示账号看完整闭环。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className={buttonClass("primary", "lg")}>
                  创建我的路径
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login?demo=1" className={buttonClass("secondary", "lg")}>
                  演示账号
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Brand />
          <p className="font-mono text-[10px] tracking-[0.12em] text-muted/50">
            移动端 / 全栈 · 初级 / 中级 / 高级
          </p>
          <p className="text-[11px] text-muted/50">
            {totals.atoms} 微课 · {totals.questions} 题 · {totals.challenges} 代码题 · {totals.interviews} 面试题
          </p>
        </div>
      </footer>
    </div>
  );
}

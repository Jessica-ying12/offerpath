"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Layers, Loader2, Smartphone } from "lucide-react";
import { Badge, Button, Input } from "@/components/ui/primitives";
import type { LevelId, TrackId } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const TRACKS: Array<{
  id: TrackId;
  name: string;
  icon: typeof Smartphone;
  copy: string;
  items: string[];
}> = [
  {
    id: "mobile",
    name: "移动端开发",
    icon: Smartphone,
    copy: "Android / Kotlin 为主线，补足 Compose、协程、性能与跨端判断。",
    items: ["Kotlin 与 Android 生命周期", "Compose 状态与重组", "性能、稳定性与跨端"],
  },
  {
    id: "fullstack",
    name: "全栈开发",
    icon: Layers,
    copy: "从浏览器到数据库：React、TypeScript、Node、SQL 与系统设计。",
    items: ["JS / TS 与 React", "Node API 与数据库", "缓存、安全与系统设计"],
  },
];

const LEVELS: Array<{
  id: LevelId;
  name: string;
  tag: string;
  copy: string;
}> = [
  {
    id: "junior",
    name: "初级",
    tag: "0–2 年 / 补基础",
    copy: "概念、常用 API、能跑通；先把边界认识清楚。",
  },
  {
    id: "middle",
    name: "中级",
    tag: "2–5 年 / 求职主力",
    copy: "机制、异常、状态管理、取舍；能定位线上问题。",
  },
  {
    id: "senior",
    name: "高级",
    tag: "5 年+ / 进阶",
    copy: "架构、性能、安全与成本；能把方案讲明白。",
  },
];

export function OnboardingWizard({
  initialTrack,
  initialLevel,
}: {
  initialTrack: TrackId;
  initialLevel: LevelId;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [track, setTrack] = useState<TrackId>(initialTrack);
  const [level, setLevel] = useState<LevelId>(initialLevel);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trackId: track,
          level,
          targetCompany: company,
          targetRole: role,
          onboarded: true,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败，请稍后重试");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="eyebrow mb-2 text-lime/80">STEP {step} / 02</div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-paper sm:text-[34px]">
            {step === 1 ? "你今天想练哪条路？" : "把目标定在正确的高度。"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {step === 1
              ? "先选方向，之后可以随时切换；学习记录会按方向保留。"
              : "等级决定讲解深度与题目难度，选你现在能扛住的，而不是最好听的。"}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          {[1, 2].map((index) => (
            <span
              key={index}
              className={cn("h-1.5 rounded-full transition-all", index <= step ? "w-8 bg-lime" : "w-4 bg-white/10")}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {TRACKS.map((item) => {
            const Icon = item.icon;
            const active = track === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                aria-pressed={active}
                className={cn(
                  "relative rounded-card border p-5 text-left transition duration-200",
                  active
                    ? "border-lime/40 bg-lime/[0.055]"
                    : "border-white/[0.08] bg-ink-800/50 hover:border-white/20",
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      active ? "border-lime/25 bg-lime/10 text-lime" : "border-white/10 text-muted",
                    )}
                  >
                    <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
                  </span>
                  {active ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink-950">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-5 text-[18px] font-semibold text-paper">{item.name}</h2>
                <p className="mt-2 text-[12px] leading-6 text-muted">{item.copy}</p>
                <ul className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-3">
                  {item.items.map((line) => (
                    <li key={line} className="text-[11px] text-muted/80">
                      · {line}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {LEVELS.map((item) => {
            const active = level === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition",
                  active
                    ? "border-lime/40 bg-lime/[0.055]"
                    : "border-white/[0.08] bg-ink-800/50 hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                    active ? "border-lime/30 bg-lime/10 text-lime" : "border-white/10 text-muted",
                  )}
                >
                  {item.id === "junior" ? "J" : item.id === "middle" ? "M" : "S"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-paper">{item.name}</span>
                    <Badge tone={active ? "lime" : "default"}>{item.tag}</Badge>
                  </span>
                  <span className="mt-1 block text-[12px] leading-5 text-muted">{item.copy}</span>
                </span>
                {active ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-ink-950">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="grid gap-3 pt-3 sm:grid-cols-2">
            <Input
              label="目标岗位（可选）"
              name="targetRole"
              placeholder="例如：全栈开发工程师"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={80}
            />
            <Input
              label="目标公司（可选）"
              name="targetCompany"
              placeholder="例如：你正在准备的公司"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              maxLength={80}
            />
          </div>
          <p className="pt-1 text-[11px] leading-5 text-muted/60">
            这些信息会用于急冲计划与模拟面试。之后可在「个人设置」里补充简历和 JD。
          </p>
        </div>
      )}

      {error ? (
        <div role="alert" className="mt-4 rounded-xl border border-coral/25 bg-coral/[0.07] px-3.5 py-2.5 text-[13px] text-coral">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between">
        {step === 2 ? (
          <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
            <ArrowLeft className="h-4 w-4" />
            上一步
          </Button>
        ) : (
          <span className="text-[11px] text-muted/50">选择会保存到你的个人档案</span>
        )}
        <Button
          size="lg"
          onClick={() => (step === 1 ? setStep(2) : submit())}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {step === 1 ? "下一步" : loading ? "正在建立目标…" : "进入训练台"}
          {step === 1 ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </div>
    </div>
  );
}

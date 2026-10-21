"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";

type Mode = "login" | "register";

export function AuthForm({
  mode,
  next,
  demoPrefill = false,
}: {
  mode: Mode;
  next?: string;
  demoPrefill?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(demoPrefill ? DEMO_EMAIL : "");
  const [password, setPassword] = useState(demoPrefill ? DEMO_PASSWORD : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { name, email, password } : { email, password },
        ),
      });
      const data = (await response.json()) as {
        error?: string;
        onboarded?: boolean;
      };
      if (!response.ok) {
        setError(data.error ?? "操作失败，请稍后重试");
        return;
      }
      if (mode === "register") {
        router.push("/onboarding");
      } else if (!data.onboarded) {
        router.push("/onboarding");
      } else {
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      }
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="eyebrow mb-3 text-lime/80">{mode === "login" ? "WELCOME BACK" : "START HERE"}</div>
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-paper">
          {mode === "login" ? "继续你的训练。" : "从今天的一小步开始。"}
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-muted">
          {mode === "login"
            ? "登录后继续学习、错题与面试记录。"
            : "注册后先选方向和等级，30 秒完成设置。"}
        </p>
      </div>

      <form method="post" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "register" ? (
          <Input
            label="昵称"
            name="name"
            autoComplete="nickname"
            placeholder="怎么称呼你"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={40}
          />
        ) : null}
        <Input
          label="邮箱"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={200}
        />
        <div className="relative">
          <Input
            label="密码"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "register" ? "至少 8 位" : "输入密码"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={mode === "register" ? 8 : 1}
            maxLength={200}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-[30px] flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-paper"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.07] px-3.5 py-2.5 text-[13px] leading-5 text-coral">
            {error}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "处理中…" : mode === "login" ? "登录并继续" : "创建账号"}
        </Button>
      </form>

      {mode === "login" ? (
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-muted">想看完整效果？使用演示账号</p>
              <p className="mt-1 font-mono text-[11px] text-paper/70">
                {DEMO_EMAIL} · {DEMO_PASSWORD}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
              className="shrink-0 rounded-lg border border-lime/20 px-2.5 py-1.5 text-[11px] font-medium text-lime transition hover:bg-lime/10"
            >
              填入
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-[13px] text-muted">
        {mode === "login" ? "还没有账号？" : "已经有账号？"}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="font-medium text-paper underline decoration-lime/50 underline-offset-4 transition hover:text-lime"
        >
          {mode === "login" ? "立即注册" : "去登录"}
        </Link>
      </p>
      <p className="mt-4 text-center text-[11px] leading-5 text-muted/60">
        登录即表示你理解：当前为 MVP，学习数据存储在本实例数据库中。
      </p>
    </div>
  );
}

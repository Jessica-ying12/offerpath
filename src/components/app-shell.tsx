"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  History,
  Home,
  ListChecks,
  MessagesSquare,
  Route,
  RotateCcw,
  Settings2,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { APP_NAV, MOBILE_NAV, TRACK_SHORT_NAME } from "@/lib/constants";
import type { Profile, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LEVEL_LABEL } from "@/lib/content/schema";

const ICONS = {
  "/dashboard": Home,
  "/library": Boxes,
  "/learn": BookOpen,
  "/bank": ListChecks,
  "/review": RotateCcw,
  "/sprint": Zap,
  "/career": Route,
  "/interview": MessagesSquare,
  "/reports": BarChart3,
  "/records": History,
} as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  profile,
  children,
}: {
  user: User;
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const trackName = TRACK_SHORT_NAME[profile.trackId] ?? profile.trackId;
  const initial = user.name.trim().slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-white/[0.06] bg-ink-950/95 px-4 py-5 backdrop-blur lg:flex">
        <div className="px-2">
          <Brand href="/dashboard" />
        </div>

        <div className="mt-9 flex items-center justify-between px-2">
          <span className="eyebrow">TRAINING DECK</span>
          <span className="font-mono text-[10px] text-muted/50">V2.0</span>
        </div>

        <nav className="mt-3 space-y-1" aria-label="主导航">
          {APP_NAV.map((item) => {
            const Icon = ICONS[item.href];
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  active
                    ? "bg-white/[0.055] text-paper"
                    : "text-muted hover:bg-white/[0.03] hover:text-paper",
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-lime" />
                ) : null}
                <Icon
                  className={cn("h-[17px] w-[17px] transition", active ? "text-lime" : "text-muted/70 group-hover:text-paper")}
                  strokeWidth={1.8}
                />
                {item.label}
                {item.href === "/records" ? (
                  <span className="ml-auto font-mono text-[9px] text-muted/40">LOG</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="eyebrow mb-2">CURRENT TARGET</div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-paper">{trackName}开发</span>
            <span className="rounded-md bg-lime/10 px-1.5 py-0.5 font-mono text-[10px] text-lime">
              {LEVEL_LABEL[profile.level]}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {profile.targetCompany ? `目标 · ${profile.targetCompany}` : "先完成今天的三个任务"}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-white/[0.07] hover:bg-white/[0.03]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-lime/25 bg-lime/10 font-mono text-sm text-lime">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-paper">{user.name}</span>
              <span className="block truncate text-[11px] text-muted">{user.email}</span>
            </span>
            <Settings2 className="h-4 w-4 text-muted/60" />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-white/[0.06] bg-ink-950/85 px-4 backdrop-blur-md lg:hidden">
          <Brand href="/dashboard" compact />
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-muted">
              {trackName} · {LEVEL_LABEL[profile.level]}
            </span>
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-lime/25 bg-lime/10 font-mono text-xs text-lime"
              aria-label="个人设置"
            >
              {initial}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="移动端导航"
      >
        <div className="mx-auto flex h-[62px] max-w-md items-stretch justify-around px-1">
          {MOBILE_NAV.map((item) => {
            const Icon = ICONS[item.href as keyof typeof ICONS] ?? Home;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition",
                  active ? "text-lime" : "text-muted/80",
                )}
              >
                {active ? (
                  <span className="absolute top-0 h-[2px] w-6 rounded-full bg-lime" />
                ) : null}
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.7} />
                {item.mobileLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

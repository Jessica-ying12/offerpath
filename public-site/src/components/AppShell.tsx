import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Compass,
  Flame,
  Home,
  Layers3,
  Map as MapIcon,
  Menu,
  MessageSquareQuote,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Route,
  Search,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { DOCS, ROLES, TOTAL_QA } from "../lib/content";
import { useStore } from "../lib/store";
import { ROADMAP_MAP } from "../data/roadmaps";
import { buildPlan } from "../lib/plan";
import { SearchDialog } from "./SearchDialog";
import { ProfileMenu } from "./ProfileMenu";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  due?: boolean;
  hideDesktop?: boolean;
};

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "学习",
    items: [
      { href: "/", label: "总览", icon: Home, exact: true },
      { href: "/roadmap", label: "路线图库", icon: MapIcon },
      { href: "/docs", label: "知识库", icon: BookOpen, badge: `${DOCS.length}` },
      { href: "/qa", label: "面试自测", icon: MessageSquareQuote, badge: `${TOTAL_QA}` },
    ],
  },
  {
    label: "训练",
    items: [
      { href: "/quiz", label: "题库练习", icon: Layers3 },
      { href: "/review", label: "周期复习", icon: RotateCcw, due: true },
    ],
  },
  {
    label: "成长",
    items: [
      { href: "/plan", label: "学习计划", icon: Route },
      { href: "/progress", label: "学习进度", icon: BarChart3 },
      { href: "/more", label: "更多", icon: MoreHorizontal, hideDesktop: true },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/", label: "总览", icon: Home, exact: true },
  { href: "/roadmap", label: "路线", icon: MapIcon },
  { href: "/quiz", label: "题库", icon: Layers3 },
  { href: "/review", label: "复习", icon: RotateCcw },
  { href: "/more", label: "更多", icon: MoreHorizontal },
];

const PAGE_TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "总览"],
  [/^\/plan/, "学习计划"],
  [/^\/roadmap/, "路线图库"],
  [/^\/docs/, "知识库"],
  [/^\/learn\//, "知识点"],
  [/^\/doc\//, "整篇参考"],
  [/^\/qa/, "面试自测"],
  [/^\/quiz/, "题库练习"],
  [/^\/review/, "周期复习"],
  [/^\/progress/, "学习进度"],
  [/^\/more/, "更多"],
  [/^\/profile/, "用户与数据"],
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (href === "/") return pathname === "/";
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="职跃深度学习站首页">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-[18px] font-bold text-lime shadow-sm dark:bg-lime dark:text-[#15200f]">
        跃
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight text-ink">职跃</span>
        <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.22em] text-muted">
          OfferPath Deep
        </span>
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { state, dueQa } = useStore();
  const pathname = useLocation().pathname;
  const planRoadmap = state.plan ? ROADMAP_MAP.get(state.plan.goal.roadmapId) : null;
  const built = state.plan && planRoadmap ? buildPlan(state.plan, planRoadmap) : null;
  const percent = built?.total ? Math.round((built.done / built.total) * 100) : 0;
  return (
    <nav className="space-y-5" aria-label="主导航">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="eyebrow mb-1.5 px-3">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, item.exact);
              if (item.hideDesktop) return null;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={`nav-item ${active ? "nav-item-active" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {item.due && dueQa > 0 ? (
                    <span className="rounded-full bg-coral px-1.5 py-0.5 font-mono text-[9px] text-white">
                      {dueQa}
                    </span>
                  ) : item.badge ? (
                    <span className="font-mono text-[9px] text-muted/60">{item.badge}</span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
      <div className="px-3 pt-1">
        <div className="rounded-xl border border-line/10 bg-surface/70 p-3">
          <div className="flex items-center justify-between">
            <span className="eyebrow">{state.plan ? "当前计划" : "学习计划"}</span>
            <span className="font-mono text-[10px] text-muted">
              {built ? `${built.done}/${built.total}` : "未设置"}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-1 text-[10.5px] font-medium text-ink">
            {state.plan?.goal.name || state.plan?.goal.title || "还没有计划"}
          </p>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-muted/70">
            {state.plan ? "计划进度只统计这个计划里的任务。" : "设置计划后，这里会显示计划进度。"}
          </p>
        </div>
      </div>
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useStore();
  const lastDoc = useMemo(
    () =>
      DOCS.filter((doc) => state.docs[doc.id]?.lastReadAt).sort(
        (a, b) =>
          new Date(state.docs[b.id]?.lastReadAt ?? 0).getTime() -
          new Date(state.docs[a.id]?.lastReadAt ?? 0).getTime(),
      )[0],
    [state.docs],
  );
  const role = ROLES.find((item) => item.id === state.role);

  return (
    <div className="flex h-full flex-col">
      {lastDoc ? (
        <Link
          to={`/learn/${lastDoc.id}`}
          onClick={onNavigate}
          className="mb-5 block rounded-2xl border border-accent/20 bg-accent/[0.055] p-3.5 transition hover:border-accent/40"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <span className="eyebrow text-accent/100">继续学习</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-accent/60" />
          </div>
          <p className="mt-2 line-clamp-1 text-[12.5px] font-semibold text-ink">
            {lastDoc.id} · {lastDoc.title}
          </p>
          <div className="progress-track mt-2 h-1">
            <div
              className="progress-fill"
              style={{ width: `${state.docs[lastDoc.id]?.percent ?? 0}%` }}
            />
          </div>
        </Link>
      ) : null}

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto pt-6">
        <Link
          to="/plan"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[11px] text-muted transition hover:border-accent/30 hover:text-ink"
        >
          <Compass className="h-3.5 w-3.5 text-accent" />
          <span className="min-w-0 flex-1 truncate">目标：{state.plan?.goal.name || role?.label}</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
        <p className="mt-2 px-1 text-[9px] leading-4 text-muted/50">
          进度保存在本机浏览器，可在「学习进度」导出备份。
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { state, setTheme, dueQa } = useStore();
  const overviewRoadmap = state.plan ? ROADMAP_MAP.get(state.plan.goal.roadmapId) : null;
  const overviewPlan = state.plan && overviewRoadmap ? buildPlan(state.plan, overviewRoadmap) : null;
  const overviewPercent = overviewPlan?.total ? Math.round((overviewPlan.done / overviewPlan.total) * 100) : 0;

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const title = PAGE_TITLES.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? "职跃";
  const role = ROLES.find((item) => item.id === state.role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line/10 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1500px] items-center gap-4 px-4 sm:px-6">
          <div className="flex w-auto shrink-0 items-center gap-3 lg:w-[252px]">
            <button
              className="btn-quiet -ml-1 p-2 lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="打开导航"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Brand />
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
            <span className="hidden text-[11px] text-muted/60 xl:inline">{title}</span>
            <button
              onClick={() => setSearchOpen(true)}
              className="group flex h-9 w-full max-w-xl items-center gap-2.5 rounded-xl border border-line/10 bg-surface px-3.5 text-left text-[12px] text-muted transition hover:border-accent/30"
            >
              <Search className="h-3.5 w-3.5 text-muted/70" />
              <span className="flex-1 truncate">搜索知识点、面试题、代码片段…</span>
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
              </span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-quiet p-2 md:hidden"
              aria-label="搜索"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              to="/plan"
              className="hidden items-center gap-1.5 rounded-full border border-line/10 bg-surface px-3 py-1.5 text-[10.5px] font-medium text-muted transition hover:border-accent/30 hover:text-ink sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {role?.label}
            </Link>
            {dueQa > 0 ? (
              <Link
                to="/review"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-raised"
                aria-label={`${dueQa} 道待复习`}
              >
                <Flame className="h-4 w-4 text-coral" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[8px] text-white">
                  {dueQa > 99 ? "99+" : dueQa}
                </span>
              </Link>
            ) : null}
            <div className="hidden sm:block">
              <ProfileMenu />
            </div>
            <div className="sm:hidden">
              <ProfileMenu compact />
            </div>
            <button
              onClick={() => setTheme(state.theme === "light" ? "dark" : "light")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-raised hover:text-ink"
              aria-label={state.theme === "light" ? "切换到深色" : "切换到浅色"}
            >
              {state.theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-line/5">
          <div
            className="h-full bg-accent/40 transition-all"
            style={{ width: `${overviewPercent}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="app-sidebar sticky top-[60px] hidden h-[calc(100vh-60px)] w-[252px] shrink-0 overflow-y-auto border-r border-line/10 px-4 py-5 lg:block">
          <SidebarContent />
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-16">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="关闭导航"
          />
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] overflow-y-auto border-r border-line/10 bg-paper p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button className="btn-quiet p-2" onClick={() => setDrawerOpen(false)} aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-[62px] max-w-lg items-stretch justify-around px-2">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(location.pathname, item.href, item.exact);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`relative flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 text-[9.5px] font-medium ${
                  active ? "text-accent" : "text-muted/70"
                }`}
              >
                {active ? (
                  <span className="absolute top-0 h-[2px] w-6 rounded-full bg-accent" />
                ) : null}
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
                {item.href === "/review" && dueQa > 0 ? (
                  <span className="absolute right-1/4 top-1.5 h-1.5 w-1.5 rounded-full bg-coral" />
                ) : null}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

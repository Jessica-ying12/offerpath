import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Plus, UserRound, X } from "lucide-react";
import { useStore } from "../lib/store";

export function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const { profiles, activeProfile, switchProfile, createProfile } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const add = () => {
    if (!name.trim()) return;
    createProfile(name);
    setName("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="切换本机用户"
        className="flex items-center gap-2 rounded-full border border-line/10 bg-surface py-1 pl-1 pr-2 text-[10.5px] text-muted transition hover:border-accent/30 hover:text-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/12 font-mono text-[11px] font-semibold text-accent">
          {activeProfile.name.slice(0, 1).toUpperCase()}
        </span>
        {!compact ? <span className="max-w-[72px] truncate">{activeProfile.name}</span> : null}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-2xl fade-up">
          <div className="border-b border-line/10 px-3 py-2.5">
            <p className="eyebrow">本机用户</p>
            <p className="mt-1 text-[9px] text-muted/60">每个用户有独立的精读、笔记和题库记录</p>
          </div>
          <div className="max-h-48 overflow-y-auto p-1.5">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  switchProfile(profile.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-raised/60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-raised font-mono text-[9px] text-muted">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink/85">{profile.name}</span>
                {profile.id === activeProfile.id ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
              </button>
            ))}
          </div>
          <div className="border-t border-line/10 p-2.5">
            <p className="mb-1.5 text-[9px] text-muted">新建本机用户</p>
            <div className="flex gap-1.5">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") add();
                }}
                maxLength={24}
                placeholder="例如：面试冲刺"
                className="min-w-0 flex-1 rounded-lg border border-line/10 bg-paper/50 px-2 py-1.5 text-[10px] text-ink outline-none focus:border-accent/40"
              />
              <button onClick={add} disabled={!name.trim()} className="rounded-lg bg-ink px-2 py-1.5 text-paper disabled:opacity-40 dark:bg-lime dark:text-[#172014]" aria-label="新建用户">
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-line/10 py-1.5 text-[9.5px] text-muted transition hover:border-accent/30 hover:text-accent"
            >
              <UserRound className="h-3 w-3" /> 管理用户与数据
              <X className="hidden" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

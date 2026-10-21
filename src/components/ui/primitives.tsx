import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-lime text-ink-950 shadow-[0_10px_30px_-18px_rgba(201,245,106,0.8)] hover:bg-[#d8ff8a] active:translate-y-px",
  secondary:
    "border border-white/10 bg-white/[0.035] text-paper hover:border-white/20 hover:bg-white/[0.07] active:translate-y-px",
  ghost: "text-muted hover:bg-white/5 hover:text-paper",
  danger: "border border-coral/30 bg-coral/10 text-coral hover:bg-coral/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-11 px-3.5 text-[13px] sm:h-9",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-11 w-11 sm:h-10 sm:w-10",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function Panel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "warn";
}) {
  return (
    <section
      className={cn(
        "relative rounded-card border bg-ink-800/60",
        tone === "default" && "border-white/[0.07]",
        tone === "accent" && "border-lime/25 bg-lime/[0.045]",
        tone === "warn" && "border-amber/25 bg-amber/[0.045]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  return (
    <time
      dateTime={iso}
      title={formatDateTime(iso)}
      className={className}
      suppressHydrationWarning
    >
      {formatRelative(iso)}
    </time>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "lime" | "mint" | "amber" | "coral" | "outline";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        tone === "default" && "bg-white/[0.06] text-muted",
        tone === "lime" && "bg-lime/15 text-lime",
        tone === "mint" && "bg-mint/12 text-mint",
        tone === "amber" && "bg-amber/12 text-amber",
        tone === "coral" && "bg-coral/12 text-coral",
        tone === "outline" && "border border-white/12 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Progress({
  value,
  total,
  className,
  tone = "lime",
  label,
}: {
  value: number;
  total: number;
  className?: string;
  tone?: "lime" | "mint" | "amber";
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "进度"}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "lime" && "bg-lime",
          tone === "mint" && "bg-mint",
          tone === "amber" && "bg-amber",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {index ? <span className="eyebrow text-lime/80">{index}</span> : null}
      <span className="eyebrow">{children}</span>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-3 text-lime/80">{eyebrow}</div> : null}
        <h1 className="text-balance text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-paper sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "lime" | "amber" | "coral";
}) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-2">{label}</div>
      <div
        className={cn(
          "font-mono text-2xl font-medium tracking-tight",
          tone === "default" && "text-paper",
          tone === "lime" && "text-lime",
          tone === "amber" && "text-amber",
          tone === "coral" && "text-coral",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-white/10 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted/70">{icon}</div> : null}
      <h3 className="text-[15px] font-semibold text-paper">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted">
        <span>{label}</span>
        {hint ? <span className="text-[11px] text-muted/60">{hint}</span> : null}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 text-sm text-paper placeholder:text-muted/40 transition focus:border-lime/40 focus:outline-none focus:ring-2 focus:ring-lime/15",
          error && "border-coral/50 focus:border-coral/60 focus:ring-coral/15",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted">
        <span>{label}</span>
        {hint ? <span className="text-[11px] text-muted/60">{hint}</span> : null}
      </label>
      <textarea
        id={inputId}
        className={cn(
          "w-full resize-y rounded-xl border border-white/10 bg-ink-900/70 px-3.5 py-3 text-sm leading-6 text-paper placeholder:text-muted/40 transition focus:border-lime/40 focus:outline-none focus:ring-2 focus:ring-lime/15",
          error && "border-coral/50 focus:border-coral/60 focus:ring-coral/15",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProgressRing({
  percent,
  size = 92,
  label,
}: {
  percent: number;
  size?: number;
  label?: ReactNode;
}) {
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="ring-progress absolute inset-0 rounded-full"
        style={{ ["--progress" as string]: safe }}
      />
      <div className="absolute inset-[7px] flex flex-col items-center justify-center rounded-full bg-ink-800 text-center">
        <span className="font-mono text-lg font-medium text-paper">{safe}%</span>
        {label ? <span className="mt-0.5 text-[10px] text-muted">{label}</span> : null}
      </div>
    </div>
  );
}

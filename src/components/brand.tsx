import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-lime",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="4" y="13" width="3.4" height="7" rx="1" fill="#070B0A" />
        <rect x="10.3" y="9" width="3.4" height="11" rx="1" fill="#070B0A" />
        <rect x="16.6" y="4" width="3.4" height="16" rx="1" fill="#070B0A" />
        <circle cx="18.3" cy="3.2" r="1.8" fill="#070B0A" />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      <BrandMark className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className="leading-none">
        <span className="block text-[16px] font-semibold tracking-[-0.02em] text-paper">职跃</span>
        {!compact ? (
          <span className="mt-1 block font-mono text-[9px] tracking-[0.24em] text-muted">OFFERPATH</span>
        ) : null}
      </span>
    </Link>
  );
}

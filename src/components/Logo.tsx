import { BRAND } from "@/lib/brand";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a3d" />
          <stop offset="1" stopColor="#f2541b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lg)" />
      <path d="M9 28c5-1 6-9 11-9s5 7 11 5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="31" cy="12" r="3.2" fill="#c7f23a" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  const first = BRAND.replace(/Club$/, "");
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="display text-[1.1rem] font-extrabold leading-none tracking-tight">
        {first}
        <span className="text-brand">Club</span>
      </span>
    </span>
  );
}

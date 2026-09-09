export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fb2ff" />
          <stop offset="1" stopColor="#2bb8a6" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" fill="none" stroke="url(#bm-g)" strokeWidth="2.2" opacity="0.9" />
      <circle cx="20" cy="20" r="10.5" fill="none" stroke="url(#bm-g)" strokeWidth="1.4" opacity="0.55" />
      <path d="M20 9.5 L28.5 27.5 H11.5 Z" fill="none" stroke="#e8eef7" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="20" cy="22.5" r="2" fill="#e8eef7" />
    </svg>
  );
}

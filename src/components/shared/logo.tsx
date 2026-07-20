export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="112" fill="#0071e3" />
      <path
        d="M256 104C256 104 160 220 160 310C160 368 203 416 256 416C309 416 352 368 352 310C352 220 256 104 256 104Z"
        fill="white"
        fillOpacity="0.15"
      />
      <path d="M272 180L210 284H252L240 348L302 244H260L272 180Z" fill="white" />
    </svg>
  );
}

export function LogoInline({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} className="rounded-[22%]" />
      <span className="text-[15px] font-semibold tracking-[-0.03em] text-ink">
        AquaVolt
      </span>
    </div>
  );
}

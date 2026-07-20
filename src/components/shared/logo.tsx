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
      <path
        d="M256 88C256 88 140 220 140 322C140 392 191 448 256 448C321 448 372 392 372 322C372 220 256 88 256 88Z"
        fill="#0071e3"
      />
      <path d="M276 168L200 296H252L236 376L312 248H260L276 168Z" fill="white" />
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

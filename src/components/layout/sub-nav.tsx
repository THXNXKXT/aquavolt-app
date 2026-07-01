"use client";

interface SubNavProps {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function SubNav({ title, children, action }: SubNavProps) {
  return (
    <div className="no-print sticky top-[48px] z-40 bg-canvas-parchment/70 backdrop-blur-xl border-b border-hairline/50">
      <div className="max-w-300 mx-auto px-5 sm:px-8 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-[17px] sm:text-[21px] font-semibold tracking-[0.231px] text-ink truncate">
            {title}
          </h2>
          {children && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-px h-4 bg-surface-chip" />
              {children}
            </div>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

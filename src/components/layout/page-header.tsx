"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  if (!title && !description && !action) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        {title && (
          <h1 className="text-[20px] sm:text-[24px] font-semibold leading-tight tracking-[-0.374px] text-ink">
            {title}
          </h1>
        )}
        {description && (
          <p className="mt-0.5 text-[13px] text-[#86868b]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1); // ellipsis
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-5 mt-5 border-t border-divider-soft">
      <p className="text-[11px] text-[#86868b]">
        Showing <span className="font-medium text-ink">{start}</span>–<span className="font-medium text-ink">{end}</span> of{" "}
        <span className="font-medium text-ink">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-full hover:bg-canvas-parchment transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-[#86868b]" />
        </button>
        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`e-${i}`} className="w-7 text-center text-[11px] text-surface-chip">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all ${
                p === currentPage
                  ? "bg-primary text-white"
                  : "text-[#86868b] hover:bg-canvas-parchment"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-full hover:bg-canvas-parchment transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 text-[#86868b]" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectAppleProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** 'pill' for filter/toolbar (rounded-full), 'input' for form dialogs (rounded-md) */
  variant?: "pill" | "input";
  className?: string;
}

export function SelectApple({
  value,
  onChange,
  options,
  placeholder,
  variant = "pill",
  className = "",
}: SelectAppleProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const shapeClass = variant === "pill" ? "rounded-full" : "rounded-md";

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 ${shapeClass} border border-hairline bg-white text-sm text-ink
                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                   hover:border-[#c7c7c7] transition-all cursor-pointer`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#86868b] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute z-50 mt-1 w-full ${shapeClass === "rounded-full" ? "rounded-[14px]" : "rounded-md"} border border-hairline bg-white shadow-lg overflow-hidden`}
          style={{ maxHeight: "280px", overflowY: "auto" }}
        >
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#86868b] text-center">
              No options
            </div>
          )}
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${isSelected ? "bg-canvas-parchment text-ink font-medium" : "text-ink"}
                  ${opt.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-canvas-parchment cursor-pointer"}
                `}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

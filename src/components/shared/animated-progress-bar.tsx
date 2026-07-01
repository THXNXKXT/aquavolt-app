"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedProgressBarProps {
  /** Percentage value (0-100) */
  value: number;
  /** Duration of the animation in ms (default: 1000) */
  duration?: number;
  /** CSS class for the fill bar color */
  fillClassName?: string;
  /** Container className */
  containerClassName?: string;
  /** Inline style for the fill bar (e.g., for dynamic colors) */
  fillStyle?: React.CSSProperties;
}

/**
 * A progress bar that animates its width from 0 to the target percentage
 * using CSS transitions. Re-animates when `value` changes.
 */
export function AnimatedProgressBar({
  value,
  duration = 1000,
  fillClassName = "bg-green-500",
  containerClassName,
  fillStyle,
}: AnimatedProgressBarProps) {
  const [width, setWidth] = useState(0);
  const prevValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;

    // Reset to 0 first, then animate to target on next frame
    setWidth(0);

    timerRef.current = setTimeout(() => {
      setWidth(value);
    }, 20); // Small delay to trigger CSS transition

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  // Initial mount animation
  useEffect(() => {
    // Small delay to ensure the 0% initial render happens before starting animation
    const t = setTimeout(() => setWidth(value), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`overflow-hidden rounded-full ${containerClassName ?? ""}`}
    >
      <div
        className={`h-full rounded-full ${fillClassName}`}
        style={{
          width: `${width}%`,
          transition: `width ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          ...fillStyle,
        }}
      />
    </div>
  );
}

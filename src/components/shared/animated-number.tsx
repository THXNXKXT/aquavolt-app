"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  /** Target numeric value to animate to */
  value: number;
  /** Optional formatting function (e.g., formatCurrency) */
  formatter?: (value: number) => string;
  /** Animation duration in milliseconds (default: 1000) */
  duration?: number;
  /** Optional CSS class name */
  className?: string;
  /** Optional aria-label override */
  ariaLabel?: string;
}

/**
 * Animate a number from 0 (or previous value) to the target value
 * using requestAnimationFrame with ease-out cubic easing.
 */
export function AnimatedNumber({
  value,
  formatter,
  duration = 1000,
  className,
  ariaLabel,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    // Ease-out cubic: 1 - (1 - t)^3
    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // If value hasn't changed, skip animation
    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString();

  return (
    <span className={className} aria-label={ariaLabel ?? formatter?.(value) ?? value.toLocaleString()}>
      {formatted}
    </span>
  );
}

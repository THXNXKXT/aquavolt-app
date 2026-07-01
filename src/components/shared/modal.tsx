"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width tailwind class, defaults to a card width. */
  maxWidthClassName?: string;
  /** labelled for a11y when used as a bare overlay (no Dialog) */
  label?: string;
}

/**
 * Animated modal overlay (framer-motion).
 *
 * AnimatePresence owns mount/unmount so both enter and exit animate cleanly —
 * no manual delay-unmount. Spring scale on the panel, fade on the backdrop.
 * Locks body scroll while open, closes on Escape and backdrop click.
 */
const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidthClassName = "max-w-lg",
  label,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className={`bg-white rounded-[18px] shadow-xl w-full ${maxWidthClassName}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={spring}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

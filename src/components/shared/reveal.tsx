"use client";

import { motion, type Variants } from "framer-motion";

/**
 * Staggered entrance for a group of children. Built for the loading → loaded
 * flip: when data arrives, items rise in together instead of popping all at once.
 *
 * Product register: 150–250ms, motion conveys state not decoration. No full-page
 * choreography — wrap only the content region that swaps from skeleton to data.
 *
 * Put one <Reveal.Item> per card/row. The container owns the stagger delay;
 * items just declare opacity + a small upward drift. Exits are instant
 * (AnimatePresence handles removal elsewhere).
 *
 * ponytail: a fixed easing + stagger; per-item tuning isn't worth a config.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
};

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

Reveal.Item = RevealItem;

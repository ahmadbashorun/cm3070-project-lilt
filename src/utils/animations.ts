import type { Variants } from "framer-motion";

export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export const breathingCircleVariants: Variants = {
  inhale: {
    scale: 1.2,
    transition: {
      duration: 4,
      ease: "easeInOut",
    },
  },
  hold: {
    scale: 1.2,
    transition: {
      duration: 7,
      ease: "easeInOut",
    },
  },
  exhale: {
    scale: 1,
    transition: {
      duration: 8,
      ease: "easeInOut",
    },
  },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const slideIn = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
};

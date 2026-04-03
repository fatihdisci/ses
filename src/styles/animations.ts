import type { Variants } from 'framer-motion'

// Apple-style spring easing — used consistently across all reveal animations
const spring = [0.22, 1, 0.36, 1] as const

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: spring },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: spring },
  },
}

export const shimmerSlide: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: spring },
  },
}

/** Used for paywall unlock reveal — blurred content fades in as blur lifts */
export const unlockReveal: Variants = {
  locked: { filter: 'blur(6px)', opacity: 0.4 },
  unlocked: {
    filter: 'blur(0px)',
    opacity: 1,
    transition: { duration: 0.9, ease: spring },
  },
}

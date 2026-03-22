"use client"

import { AnimatePresence, motion } from "framer-motion"

interface AnimatedPriceProps {
  price: number
  period: string
  /** 1 = price went up (monthly), -1 = price went down (weekly) */
  direction: 1 | -1
  priceClassName?: string
  periodClassName?: string
}

const slide = {
  enter: (dir: number) => ({
    y: dir * 24,
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.95,
  }),
  center: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
  },
  exit: (dir: number) => ({
    y: dir * -24,
    opacity: 0,
    filter: "blur(4px)",
    scale: 1.05,
  }),
}

const transition = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

export function AnimatedPrice({
  price,
  period,
  direction,
  priceClassName,
  periodClassName,
}: AnimatedPriceProps) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className={priceClassName}>$</span>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={price}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className={`block ${priceClassName ?? ""}`}
          >
            {price.toFixed(2)}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="relative overflow-hidden self-end pb-0.5">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={period}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className={`block ${periodClassName ?? ""}`}
          >
            {`/ ${period}`}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

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
  enter: (dir: number) => ({ y: dir * 16, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:  (dir: number) => ({ y: dir * -16, opacity: 0 }),
}

const transition = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }

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
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
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
      <div className="overflow-hidden self-end pb-0.5">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
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

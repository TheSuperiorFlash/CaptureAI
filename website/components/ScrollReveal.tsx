'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

interface ScrollRevealProps {
    children: ReactNode
    className?: string
    delay?: number
    stagger?: number
    yOffset?: number
    margin?: string
}

export function ScrollReveal({ children, className = "", delay = 0, yOffset = 30, margin = "-50px" }: ScrollRevealProps) {
    const reduced = useReducedMotion()
    if (reduced) return <div className={className}>{children}</div>
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin }}
            transition={{ duration: 0.45, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function ScrollRevealStagger({ children, className = "", delay = 0, stagger = 0.1, margin = "-50px" }: ScrollRevealProps) {
    const reduced = useReducedMotion()
    if (reduced) return <div className={className}>{children}</div>
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: stagger,
                        delayChildren: delay,
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export function ScrollRevealItem({ children, className = "", transition }: { children: ReactNode, className?: string, transition?: object }) {
    const reduced = useReducedMotion()
    if (reduced) return <div className={className}>{children}</div>
    const defaultTransition = transition ?? { type: "spring", stiffness: 100, damping: 20 }
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: defaultTransition
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

'use client'

import { motion, useSpring, useTransform, useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'

export default function AnimatedCounter({ value, prefix = '' }: { value: number, prefix?: string }) {
    const ref = useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true, margin: "-50px" })

    const spring = useSpring(0, { stiffness: 150, damping: 20, mass: 1 })

    // Force a smooth transition to the numeric value stopping at 2 decimal places
    const displayValue = useTransform(spring, (current) => `${prefix}${current.toFixed(2)}`)

    useEffect(() => {
        if (inView) {
            spring.set(value)
        }
    }, [inView, spring, value])

    return <motion.span ref={ref}>{displayValue}</motion.span>
}

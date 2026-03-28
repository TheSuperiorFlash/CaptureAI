'use client'

import { useRef, useState } from 'react'
import { motion, useSpring, useReducedMotion } from 'framer-motion'

interface MagneticButtonProps {
    children: React.ReactNode
    className?: string
    magneticRange?: number
}

export default function MagneticButton({ children, className = '', magneticRange = 10 }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement | HTMLAnchorElement | HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    // Springs for ultra-smooth buttery tracking
    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 }
    const x = useSpring(0, springConfig)
    const y = useSpring(0, springConfig)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current || shouldReduceMotion) return

        const { clientX, clientY } = e
        const { height, width, left, top } = ref.current.getBoundingClientRect()

        // Find center of button
        const centerX = left + width / 2
        const centerY = top + height / 2

        // Calculate distance from mouse to center
        const distX = clientX - centerX
        const distY = clientY - centerY

        // Pull the button towards the mouse (divide by a factor to make it subtle)
        x.set(distX * (magneticRange / width))
        y.set(distY * (magneticRange / height))
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
        setIsHovered(false)
    }

    const handleMouseEnter = () => {
        setIsHovered(true)
    }

    // Since we don't know the exact HTML element type the child relies on, we wrap it in a motion.div
    // Be careful to apply it to buttons or links
    return (
        <motion.div
            ref={ref as React.Ref<HTMLDivElement>}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ x, y }}
            className={`cursor-pointer inline-block ${className}`}
        >
            {children}
        </motion.div>
    )
}

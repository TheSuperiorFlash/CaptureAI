'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function ScrollStory() {
    const containerRef = useRef<HTMLDivElement>(null)

    // Track scroll progress through the 300vh container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    })

    // --- Story Sequence 1 ---
    // Fades in from 0 -> 0.1, stays until 0.25, fades out by 0.33
    const opacity1 = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.33], [0, 1, 1, 0])
    const y1 = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.33], [40, 0, 0, -40])
    const scale1 = useTransform(scrollYProgress, [0, 0.1, 0.25, 0.33], [0.95, 1, 1, 1.05])

    // --- Story Sequence 2 ---
    // Fades in from 0.33 -> 0.43, stays until 0.58, fades out by 0.66
    const opacity2 = useTransform(scrollYProgress, [0.33, 0.43, 0.58, 0.66], [0, 1, 1, 0])
    const y2 = useTransform(scrollYProgress, [0.33, 0.43, 0.58, 0.66], [40, 0, 0, -40])
    const scale2 = useTransform(scrollYProgress, [0.33, 0.43, 0.58, 0.66], [0.95, 1, 1, 1.05])

    // --- Story Sequence 3 ---
    // Fades in from 0.66 -> 0.76, stays until 1.0
    const opacity3 = useTransform(scrollYProgress, [0.66, 0.76, 0.95, 1], [0, 1, 1, 0])
    const y3 = useTransform(scrollYProgress, [0.66, 0.76, 0.95, 1], [40, 0, 0, -20])
    const scale3 = useTransform(scrollYProgress, [0.66, 0.76, 0.95, 1], [0.95, 1, 1, 1.02])

    // --- Background Glow ---
    // Transitions color and scale to provide immersive feedback
    const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.5, 1])
    const glowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.4, 0.4, 0])

    return (
        <section ref={containerRef} className="relative h-[400vh] bg-[--color-background]">
            {/* 
              This is the sticky viewport. It stays pinned while the user scrolls 
              through the 400vh parent container.
            */}
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">

                {/* Immersive background glow tracking the scroll */}
                <motion.div
                    className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen gradient-blur"
                    style={{
                        scale: glowScale,
                        opacity: glowOpacity,
                        background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, rgba(0,71,255,0.1) 50%, transparent 70%)'
                    }}
                />

                <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center px-6 text-center">

                    {/* Sequence 1 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                        style={{ opacity: opacity1, y: y1, scale: scale1 }}
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                            Homework shouldn&apos;t be a <br className="hidden md:block" />
                            <span className="text-gradient">search mission.</span>
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                            Stop switching tabs and digging through irrelevant forum posts.
                        </p>
                    </motion.div>

                    {/* Sequence 2 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                        style={{ opacity: opacity2, y: y2, scale: scale2 }}
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                            Your screen is the context.
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                            CaptureAI reads the exact phrasing, the multiple-choice options, and the diagrams simultaneously.
                        </p>
                    </motion.div>

                    {/* Sequence 3 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                        style={{ opacity: opacity3, y: y3, scale: scale3 }}
                    >
                        <h2 className="drop-shadow-[0_0_40px_rgba(0,240,255,0.3)] text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                            The answer appears <br className="hidden md:block" />
                            where you need it most.
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                            Instantly. Seamlessly. Without a trace.
                        </p>
                    </motion.div>

                </div>
            </div>
        </section>
    )
}

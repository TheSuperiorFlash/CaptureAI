'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

export default function ScrollStory() {
    const reduced = useReducedMotion()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])

    // Track scroll progress through the 400vh container
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

    // --- Central Visual Anchor ---
    const anchorScale = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0.5, 1, 1.1, 1.2])
    const anchorRotateX = useTransform(scrollYProgress, [0, 0.4, 1], [35, 0, -15])
    const anchorOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
    const anchorY = useTransform(scrollYProgress, [0, 0.4, 1], [150, 0, -100])

    // --- Window UI Transitions ---
    const clutterOpacity = useTransform(scrollYProgress, [0.3, 0.4], [1, 0])
    const cleanOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1])
    const captureBoxOpacity = useTransform(scrollYProgress, [0.45, 0.55, 0.65, 0.75], [0, 1, 1, 0])
    const captureBoxClipPath = useTransform(scrollYProgress, [0.45, 0.55], ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"])

    // --- Answer Selection ---
    const answerOpacity = useTransform(scrollYProgress, [0.72, 0.82], [0, 1])

    // --- Background Glow ---
    // Transitions color and scale to provide immersive feedback
    const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.5, 1])
    const glowOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.3, 0.3, 0])

    // Reduced motion: render all three story sequences statically, no sticky scroll
    // NOTE: must wait until mounted so SSR and client initial render match (avoids hydration error)
    if (isMounted && reduced) {
        return (
            <section className="relative bg-[--color-background] py-24 space-y-24">
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                        Homework shouldn&apos;t be a <br className="hidden md:block" />
                        <span className="text-gradient">search mission.</span>
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                        Press a key, drag to select. CaptureAI picks up exactly what&apos;s on your screen, no typing required.
                    </p>
                </div>
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                        The AI reads what you see instantly.
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                        Text, multiple-choice options, and diagrams. Everything visible in your selection is analyzed in seconds.
                    </p>
                </div>
                <div className="mx-auto max-w-5xl px-6 text-center">
                    <h2 className="drop-shadow-[0_0_40px_rgba(0,240,255,0.3)] text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                        The answer appears <br className="hidden md:block" />
                        where you need it most.
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-[--color-text-secondary] md:text-2xl">
                        Instantly. Seamlessly. Without a trace.
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section ref={containerRef} className="relative h-[400vh] bg-[--color-background]">
            {/*
              This is the sticky viewport. It stays pinned while the user scrolls
              through the 400vh parent container.
            */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Immersive background glow tracking the scroll */}
                <motion.div
                    className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full hidden md:block mix-blend-screen gradient-blur pointer-events-none"
                    style={{
                        scale: glowScale,
                        opacity: glowOpacity,
                        background: 'radial-gradient(circle, rgba(0,240,255,0.4) 0%, rgba(0,71,255,0.1) 50%, transparent 70%)'
                    }}
                />

                {/* Central Visual Anchor (The "Interface") */}
                <div className="absolute inset-0 flex items-center justify-center perspective-[1200px] pointer-events-none">
                    <motion.div
                        className="flex h-[400px] w-[320px] md:h-[600px] md:w-[800px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#060913] md:bg-black/40 shadow-[0_0_30px_rgba(0,100,255,0.1)] md:shadow-[0_0_50px_rgba(0,100,255,0.15)] md:backdrop-blur-xl will-change-transform"
                        style={{
                            scale: anchorScale,
                            rotateX: anchorRotateX,
                            opacity: anchorOpacity,
                            y: anchorY,
                        }}
                    >
                        {/* Mock UI Top Bar */}
                        <div className="flex w-full items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 relative overflow-hidden">
                            <div className="flex items-center gap-4">
                                <div className="flex z-10 items-center gap-2 relative">
                                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                                </div>
                                {/* Cluttered Tabs */}
                                <motion.div style={{ opacity: clutterOpacity }} className="absolute left-[85px] md:left-24 flex gap-1.5 md:gap-2 pointer-events-none">
                                    <div className="inline-flex h-4 w-16 md:h-6 md:w-24 rounded bg-white/10" />
                                    <div className="inline-flex h-4 w-16 md:h-6 md:w-24 rounded bg-white/5" />
                                    <div className="hidden md:inline-flex h-5 w-20 md:h-6 md:w-24 rounded bg-white/5" />
                                </motion.div>
                                {/* Clean Tab */}
                                <motion.div style={{ opacity: cleanOpacity }} className="absolute left-[85px] md:left-24 flex gap-1.5 md:gap-2 pointer-events-none">
                                    <div className="inline-flex h-4 w-16 md:h-6 md:w-24 rounded bg-white/10" />
                                </motion.div>
                            </div>
                            <div className="hidden md:block h-4 w-24 rounded bg-white/5 relative z-10" />
                        </div>
                        {/* Mock Internal Content */}
                        <div className="relative flex h-full w-full flex-col p-6 overflow-hidden">
                            {/* Cluttered State */}
                            <motion.div style={{ opacity: clutterOpacity }} className="absolute inset-x-6 top-6 bottom-6 flex flex-col gap-4 pointer-events-none">
                                <div className="flex gap-4 h-16 md:h-20 w-full mb-2">
                                    <div className="h-full w-2/3 rounded-lg bg-white/5" />
                                    <div className="h-full w-1/3 rounded-lg bg-white/5" />
                                </div>
                                <div className="flex gap-4 flex-1">
                                    <div className="h-full w-1/4 rounded-lg bg-white/5 flex flex-col gap-3 p-3">
                                        <div className="h-4 w-full rounded bg-white/10" />
                                        <div className="h-4 w-5/6 rounded bg-white/10" />
                                        <div className="h-4 w-3/4 rounded bg-white/10" />
                                    </div>
                                    <div className="h-full flex-1 rounded-lg bg-white/5 flex flex-col gap-4 p-5">
                                        <div className="h-8 w-1/2 rounded bg-white/10" />
                                        <div className="h-5 w-full rounded bg-white/5" />
                                        <div className="h-5 w-full rounded bg-white/5" />
                                        <div className="h-5 w-4/5 rounded bg-white/5" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Clean State (Mock Quiz UI + Capture) */}
                            <motion.div style={{ opacity: cleanOpacity }} className="absolute inset-0 pointer-events-none">
                                {/* Top-Left Quiz Area */}
                                <div className="absolute top-10 left-8 right-8 md:right-auto md:top-14 md:left-14 md:w-full md:max-w-[400px] flex flex-col gap-6 md:gap-8 origin-top scale-95 md:scale-100">
                                    {/* Mock Question Area 1 (Captured) */}
                                    <div className="relative">
                                        <div className="w-full space-y-4">
                                            <div className="h-6 w-full rounded-md bg-white/10" />
                                            <div className="h-6 w-3/4 rounded-md bg-white/10" />

                                            {/* Options */}
                                            <div className="flex flex-col gap-5 pt-6 ml-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                    <div className="h-5 w-1/2 rounded-md bg-white/5" />
                                                </div>
                                                <div className="flex items-center gap-4 relative">
                                                    {/* Base Option */}
                                                    <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                    <div className="h-5 w-3/4 rounded-md bg-white/5" />

                                                    {/* Selected State Overlay (Only highlights the circle and text) */}
                                                    <motion.div
                                                        style={{ opacity: answerOpacity }}
                                                        className="absolute inset-0 flex items-center gap-4 z-20"
                                                    >
                                                        <div className="relative h-5 w-5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] flex items-center justify-center border-none">
                                                            <div className="h-2 w-2 rounded-full bg-white" />
                                                        </div>
                                                        <div className="h-5 w-3/4 rounded-md bg-green-400/40" />
                                                    </motion.div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                    <div className="h-5 w-1/3 rounded-md bg-white/5" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                    <div className="h-5 w-2/3 rounded-md bg-white/5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Floating Capture Overlay - Sized tightly around quiz 1 */}
                                        <motion.div
                                            className="absolute -inset-3 md:-inset-5 overflow-hidden rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-400/5 mix-blend-screen"
                                            style={{
                                                opacity: captureBoxOpacity,
                                                clipPath: captureBoxClipPath
                                            }}
                                        />
                                    </div>

                                    {/* Mock Question Area 2 (Uncaptured) */}
                                    <div className="w-full space-y-4 opacity-40 mt-6">
                                        <div className="h-6 w-full rounded-md bg-white/10" />
                                        <div className="h-6 w-3/4 rounded-md bg-white/10" />

                                        {/* Options */}
                                        <div className="flex flex-col gap-5 pt-6 ml-2">
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                <div className="h-5 w-1/2 rounded-md bg-white/5" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                <div className="h-5 w-3/4 rounded-md bg-white/5" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                <div className="h-5 w-1/3 rounded-md bg-white/5" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full border border-white/20 bg-white/5" />
                                                <div className="h-5 w-2/3 rounded-md bg-white/5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                <div className="relative mx-auto h-full w-full max-w-5xl px-6 text-center z-10">

                    {/* Sequence 1 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-shadow-glow md:drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)]"
                        style={{ opacity: opacity1, y: y1, scale: scale1 }}
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                            Homework shouldn&apos;t be a <br className="hidden md:block" />
                            <span className="text-gradient">search mission.</span>
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-2xl">
                            Press a key, drag to select. CaptureAI picks up exactly what&apos;s on your screen, no typing required.
                        </p>
                    </motion.div>

                    {/* Sequence 2 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-shadow-glow md:drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)]"
                        style={{ opacity: opacity2, y: y2, scale: scale2 }}
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-[--color-text] md:text-6xl lg:text-7xl">
                            The AI reads what you see instantly.
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-2xl">
                            Text, multiple-choice options, and diagrams. Everything visible in your selection is analyzed in seconds.
                        </p>
                    </motion.div>

                    {/* Sequence 3 */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-shadow-glow md:drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)]"
                        style={{ opacity: opacity3, y: y3, scale: scale3 }}
                    >
                        <h2 className="md:drop-shadow-[0_0_40px_rgba(0,240,255,0.3)] text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
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

'use client'

import { useRef, useEffect } from 'react'
import { Camera, MousePointer, Eye, Zap, Repeat, Shield, MessageSquare, Infinity as InfinityIcon, LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    pro?: boolean
    color: string
    glow: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Screenshot Capture',
        description: 'Select any area of your screen with a keyboard shortcut. The extension reads the text and instantly gives you the correct answer.',
        color: 'from-blue-600/30 to-blue-700/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(0,71,255,0.15)] group-hover:border-blue-500/30',
    },
    {
        icon: MousePointer,
        title: 'Floating Interface',
        description: 'A small, draggable panel sits on top of any webpage. Click it to capture, view answers, or access settings without leaving your tab.',
        color: 'from-cyan-500/30 to-cyan-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] group-hover:border-cyan-500/30',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear inline on the page in a subtle overlay. No popups, no new windows — just the answer, right where you need it.',
        color: 'from-indigo-500/30 to-indigo-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:border-indigo-500/30',
    },
    {
        icon: Zap,
        title: 'Works on Any Site',
        description: 'Homework platforms, study guides, PDFs in the browser — if you can see it on screen, CaptureAI can read and answer it.',
        color: 'from-sky-500/30 to-sky-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.15)] group-hover:border-sky-500/30',
    },
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Prevents quiz platforms from detecting extension activity. Your browser logs stay clean and show only normal browsing behavior.',
        pro: true,
        color: 'from-teal-500/30 to-teal-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:border-teal-500/30',
    },
    {
        icon: MessageSquare,
        title: 'Ask Mode',
        description: 'Ask follow-up questions about a captured screenshot or type a question directly. Get detailed explanations, not just answers.',
        pro: true,
        color: 'from-violet-500/30 to-violet-600/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:border-violet-500/30',
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically answers questions on supported platforms like Vocabulary.com. Enable it and let the extension work through problems for you.',
        pro: true,
        color: 'from-blue-400/30 to-cyan-500/10',
        glow: 'group-hover:shadow-[0_0_30px_rgba(96,165,250,0.15)] group-hover:border-blue-400/30',
    },
    {
        icon: InfinityIcon,
        title: 'Unlimited Requests',
        description: 'Free users get 10 requests per day. Pro removes that limit entirely — use CaptureAI as much as you need.',
        pro: true,
        color: 'from-[#0047ff]/40 to-[#00f0ff]/20',
        glow: 'group-hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] group-hover:border-[#00f0ff]/40',
    },
]

function FeatureCard({ feature, index, shouldReduceMotion, disableAnimation }: { feature: Feature, index: number, shouldReduceMotion: boolean | null, disableAnimation?: boolean }) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x, { stiffness: 400, damping: 30 })
    const mouseYSpring = useSpring(y, { stiffness: 400, damping: 30 })

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"])

    // Dynamic Glare
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"])
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"])
    const backgroundImage = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 70%)`

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        x.set(mouseX / width - 0.5)
        y.set(mouseY / height - 0.5)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    const Icon = feature.icon
    const shouldDisable = shouldReduceMotion || disableAnimation;

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: shouldDisable ? 0 : rotateX,
                rotateY: shouldDisable ? 0 : rotateY,
                transformStyle: "preserve-3d",
                transitionProperty: "color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow",
            }}
            initial={shouldDisable ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={shouldDisable ? { duration: 0 } : {
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: (index % 4) * 0.1
            }}
            className={`glass-card group h-full relative flex flex-col rounded-3xl p-7 transition-shadow duration-300 ease-out ${feature.glow}`}
        >
            {/* Dynamic Glass Glare Overlay */}
            <motion.div
                className="absolute inset-0 rounded-3xl opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                style={{ backgroundImage }}
            />
            {/* Inner Content bumped up in Z space to create parallax */}
            <div className="relative z-10 flex flex-col h-full pointer-events-none" style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
                {feature.pro && (
                    <span className="absolute right-0 top-0 rounded-full bg-gradient-to-r from-[#0047ff]/20 to-[#00f0ff]/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-cyan-400 border border-cyan-500/20 shadow-lg">
                        PRO
                    </span>
                )}
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br border border-white/5 shadow-inner ${feature.color}`}>
                    <Icon className="h-5 w-5 text-white/90" strokeWidth={2.5} />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-[--color-text]">
                    {feature.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[--color-text-tertiary] group-hover:text-[--color-text-secondary] transition-colors pointer-events-auto">
                    {feature.description}
                </p>
            </div>
        </motion.div>
    )
}

export default function Features() {
    const shouldReduceMotion = useReducedMotion()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let rafId: number | null = null
        // Jump to the middle copy on mount to allow immediate infinite swiping
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current
            // Use requestAnimationFrame to let the DOM settle and measure width accurately
            rafId = requestAnimationFrame(() => {
                if (container.scrollWidth > container.clientWidth) {
                    container.scrollLeft = container.scrollWidth / 3
                }
            })
        }
        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
            }
        }
    }, [])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget
        const oneThird = container.scrollWidth / 3
        const threshold = Math.max(10, oneThird * 0.03)
        if (container.scrollLeft <= threshold) {
            // Jump forward one full set length seamlessly
            container.scrollLeft += oneThird
        } else if (container.scrollLeft >= (oneThird * 2) - threshold) {
            // Jump backward one full set length seamlessly
            container.scrollLeft -= oneThird
        }
    }

    return (
        <section id="features" className="relative py-24 md:py-32 reveal-up overflow-x-clip">
            <div className="pointer-events-none absolute inset-0 aurora-bg opacity-30" />
            <div className="relative z-10 mx-auto max-w-6xl px-6">
                {/* Header */}
                <motion.div
                    className="mx-auto mb-16 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
                >
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Everything you need, </span>
                        <span className="text-gradient">nothing you don&apos;t</span>
                    </h2>
                    <p className="text-lg text-[--color-text-secondary]">
                        What the extension does, in plain terms.
                    </p>
                </motion.div>

                {/* Desktop Grid */}
                <div className="hidden sm:grid gap-5 grid-cols-2 lg:grid-cols-4 perspective-[1200px]">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.title}
                            feature={feature}
                            index={index}
                            shouldReduceMotion={shouldReduceMotion}
                        />
                    ))}
                </div>

                {/* Mobile Infinite Swipe Row */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="grid sm:hidden grid-flow-col auto-cols-[85vw] min-[400px]:auto-cols-[320px] -mx-6 px-6 overflow-x-auto snap-x snap-mandatory gap-5 perspective-[1200px] pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x"
                >
                    {[...features, ...features, ...features].map((feature, index) => (
                        <div key={`${feature.title}-${index}`} className="snap-center h-full w-full">
                            <FeatureCard
                                feature={feature}
                                index={index}
                                shouldReduceMotion={shouldReduceMotion}
                                disableAnimation={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

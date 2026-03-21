'use client'

import { useRef, useState } from 'react'
import { Camera, MousePointer, Eye, Repeat, Shield, MessageSquare, LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'

interface Feature {
    icon: LucideIcon
    title: string
    description: string
    mobileDescription?: string
    pro?: boolean
    color: string
    glow: string
}

const features: Feature[] = [
    {
        icon: Camera,
        title: 'Screenshot Capture',
        description: 'Capture any screen area and get the correct answer instantly.',
        color: 'from-blue-600/30 to-blue-700/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(0,71,255,0.15)] sm:hover:border-blue-500/30',
    },
    {
        icon: MousePointer,
        title: 'Floating Interface',
        description: 'A draggable panel over any webpage for captures and answers.',
        color: 'from-cyan-500/30 to-cyan-600/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] sm:hover:border-cyan-500/30',
    },
    {
        icon: Eye,
        title: 'Stealth Mode',
        description: 'Answers appear inline — no popups, no new windows.',
        color: 'from-indigo-500/30 to-indigo-600/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] sm:hover:border-indigo-500/30',
    },
    {
        icon: Shield,
        title: 'Privacy Guard',
        description: 'Hides all extension or browser (tab switching) activity from quiz platforms.',
        pro: true,
        color: 'from-teal-500/30 to-teal-600/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(20,184,166,0.15)] sm:hover:border-teal-500/30',
    },
    {
        icon: MessageSquare,
        title: 'Ask Mode',
        description: 'Type or capture to get detailed explanations, not just answers.',
        pro: true,
        color: 'from-violet-500/30 to-violet-600/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] sm:hover:border-violet-500/30',
    },
    {
        icon: Repeat,
        title: 'Auto-Solve',
        description: 'Automatically answers questions on supported platforms (e.g. Vocabulary.com)',
        mobileDescription: 'Automatically answers questions on supported sites (e.g. Vocabulary.com)',
        pro: true,
        color: 'from-blue-400/30 to-cyan-500/10',
        glow: 'sm:hover:shadow-[0_0_30px_rgba(96,165,250,0.15)] sm:hover:border-blue-400/30',
    },
]

function FeatureCard({ feature, index, animate }: { feature: Feature; index: number; animate: boolean }) {
    const Icon = feature.icon
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const mouseXSpring = useSpring(x, { stiffness: 400, damping: 30 })
    const mouseYSpring = useSpring(y, { stiffness: 400, damping: 30 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg'])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg'])

    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['100%', '0%'])
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['100%', '0%'])
    const backgroundImage = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.12) 0%, transparent 70%)`

    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 30 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: (index % 4) * 0.1 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={animate ? { transformStyle: 'preserve-3d', rotateX, rotateY, transformPerspective: 1200 } : undefined}
            className={`glass-card group h-full relative flex flex-col rounded-3xl p-7 pb-11 sm:pb-7 transition-shadow duration-300 ease-out ${feature.glow}`}
        >
            {/* Glare overlay */}
            <motion.div
                className="absolute inset-0 rounded-3xl opacity-0 mix-blend-overlay transition-opacity duration-300 sm:group-hover:opacity-100 pointer-events-none"
                style={{ backgroundImage }}
            />
            <div className="relative flex flex-col h-full" style={animate ? { transform: 'translateZ(40px)', transformStyle: 'preserve-3d' } : undefined}>
                {feature.pro && (
                    <span className="absolute right-0 top-0 rounded-full bg-gradient-to-r from-[#0047ff]/20 to-[#00f0ff]/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-cyan-400 shadow-lg">
                        PRO
                    </span>
                )}
                <div className={`mb-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br border border-white/5 shadow-inner ${feature.color}`}>
                    <Icon className="h-5 w-5 text-white/90" strokeWidth={2.5} />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-[--color-text]">
                    {feature.title}
                </h3>
                <p className="flex-1 text-[14px] leading-relaxed text-[--color-text-tertiary] sm:group-hover:text-[--color-text-secondary] transition-colors">
                    <span className={feature.mobileDescription ? 'hidden sm:inline' : ''}>
                        {feature.description}
                    </span>
                    {feature.mobileDescription && (
                        <span className="sm:hidden">
                            {feature.mobileDescription}
                        </span>
                    )}
                </p>
            </div>
        </motion.div>
    )
}

export default function Features() {
    const shouldReduceMotion = useReducedMotion()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget
        const containerCenter = container.scrollLeft + container.clientWidth / 2
        const cards = Array.from(container.children) as HTMLDivElement[]

        let nextIndex = 0
        let smallestDistance = Number.POSITIVE_INFINITY

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2
            const distance = Math.abs(cardCenter - containerCenter)
            if (distance < smallestDistance) {
                smallestDistance = distance
                nextIndex = index
            }
        })

        setActiveIndex(nextIndex)
    }

    return (
        <section id="features" className="relative py-24 md:py-32 reveal-up overflow-x-clip">
            <div className="pointer-events-none absolute inset-0 aurora-bg opacity-30" />
            <div className="relative z-10 mx-auto max-w-7xl px-6">
                <motion.div
                    className="mx-auto mb-16 max-w-2xl text-center"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
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
                <div className="hidden sm:grid gap-6 grid-cols-2 lg:grid-cols-3 auto-rows-max">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.title}
                            feature={feature}
                            index={index}
                            animate={!shouldReduceMotion}
                        />
                    ))}
                </div>

                {/* Mobile Finite Swipe with Indicators */}
                <div className="sm:hidden -mx-6 px-6 pb-6 w-[100vw]">
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="grid grid-flow-col auto-cols-[85vw] min-[400px]:auto-cols-[320px] overflow-x-auto snap-x snap-mandatory gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {features.map((feature, index) => (
                            <div key={`${feature.title}-${index}`} className="snap-center h-[90%] w-full">
                                <FeatureCard
                                    feature={feature}
                                    index={index}
                                    animate={false}
                                />
                            </div>
                        ))}
                    </div>
                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-2">
                        {features.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-cyan-400' : 'w-1.5 bg-white/20'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

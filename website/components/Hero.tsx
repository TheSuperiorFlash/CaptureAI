'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, Variants, useReducedMotion, useMotionValue, useSpring, useTransform, useAnimationFrame } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import MagneticButton from './MagneticButton'
import { SparklesCore } from '@/components/ui/sparkles'
const MotionLink = motion.create(Link)

const platformLogos = [
    { src: '/platforms/moodle.png', alt: 'Moodle', heightClass: 'h-8' },
    { src: '/platforms/respondus.png', alt: 'Respondus', heightClass: 'h-7' },
    { src: '/platforms/schoology.png', alt: 'Schoology', heightClass: 'h-8' },
    { src: '/platforms/canvas.png', alt: 'Canvas', heightClass: 'h-8' },
    { src: '/platforms/blackboard.png', alt: 'Blackboard', heightClass: 'h-5' },
    { src: '/platforms/tophat.png', alt: 'Top Hat', heightClass: 'h-5' },
]

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            stiffness: 150,
            damping: 20,
            mass: 1
        }
    }
}

function PlatformMarquee({ logos }: { logos: typeof platformLogos }) {
    const trackRef = useRef<HTMLDivElement>(null)
    const xPos = useRef(0)
    const x = useMotionValue(0)
    const speed = 25 // pixels per second (matches old 30s CSS animation)

    useAnimationFrame((_, delta) => {
        if (!trackRef.current) return
        // Measure half the track (one full set of logos)
        const halfWidth = trackRef.current.scrollWidth / 2
        if (halfWidth === 0) return

        xPos.current -= speed * (delta / 1000)
        // Seamless reset: once we've scrolled one full set, snap back
        if (Math.abs(xPos.current) >= halfWidth) {
            xPos.current += halfWidth
        }
        x.set(xPos.current)
    })

    return (
        <div className="relative mx-auto flex max-w-5xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <motion.div
                ref={trackRef}
                className="flex"
                style={{ x }}
            >
                {[0, 1].map((setIndex) => (
                    <div key={setIndex} className="flex flex-shrink-0 items-center gap-12 pr-12">
                        {logos.map((platform) => (
                            <div
                                key={`${platform.alt}-${setIndex}`}
                                className="flex-shrink-0 opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                            >
                                <Image
                                    src={platform.src}
                                    alt={platform.alt}
                                    width={120}
                                    height={40}
                                    className={`${platform.heightClass} w-auto`}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

export default function Hero() {
    const shouldReduceMotion = useReducedMotion()
    const [isMounted, setIsMounted] = useState(false)

    const text1Words = "Screenshot any question.".split(' ')
    const text2Words = "Get the exact answer.".split(' ')

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])

    return (
        <section
            className="relative overflow-x-clip pb-32 pt-32 md:pb-48 md:pt-48"
        >
            {/* Layered deeper gradient background with smooth fade-out */}
            <div className="pointer-events-none absolute -inset-x-0 top-0 bottom-[-400px] z-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
                <div className="absolute inset-0 aurora-bg" />

                {/* Blob 1: Top Center */}
                <div className="absolute left-[50%] top-[-200px] h-[1000px] w-[1000px] -ml-[500px] pointer-events-none">
                    <div
                        className="h-full w-full rounded-full bg-[#0047ff] gradient-blur"
                        style={{ opacity: isMounted ? 0.4 : 0 }}
                    />
                </div>

                {/* Blob 2: Right */}
                <div className="absolute right-[-100px] top-[50px] h-[800px] w-[800px] pointer-events-none">
                    <div
                        className="h-full w-full rounded-full bg-[#00f0ff] gradient-blur"
                        style={{ opacity: isMounted ? 0.3 : 0 }}
                    />
                </div>

                {/* Blob 3: Bottom Left */}
                <div className="absolute bottom-[300px] left-[-150px] h-[1000px] w-[1000px] pointer-events-none">
                    <div
                        className="h-full w-full rounded-full bg-[#0d3bbf] gradient-blur"
                        style={{ opacity: isMounted ? 0.3 : 0 }}
                    />
                </div>
                {/* Sparkles particle background — dynamic density based on reduced motion */}
                <div className="absolute inset-0 h-full w-full">
                    <SparklesCore
                        id="hero-sparkles"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={30}
                        className="h-full w-full"
                        particleColor="#FFFFFF"
                        speed={1}
                    />
                </div>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <motion.div
                    className="mx-auto max-w-4xl text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="glass mb-8 inline-flex items-center gap-3 rounded-full px-4 py-1.5 border-cyan-500/20 bg-[#0a0b0c]/80">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                        </span>
                        <span className="text-[13px] font-semibold tracking-wide text-cyan-50">Chrome Extension</span>
                        <span className="h-3 w-px bg-[--color-border]" />
                        <span className="text-[13px] font-medium text-[--color-text-tertiary]">Easy install</span>
                    </motion.div>

                    <motion.h1 className="mb-4 drop-shadow-[0_4px_32px_rgba(0,0,0,0.85)] flex flex-col items-center font-extrabold tracking-tight">
                        <div className="hero-title flex flex-nowrap justify-center pb-1 text-[--color-text]">
                            {text1Words.map((word, i) => (
                                <motion.span key={`w1-${i}`} variants={itemVariants} className={`inline-block ${i !== text1Words.length - 1 ? 'mr-[0.3em]' : ''}`}>
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                        <div className="hero-title flex flex-wrap sm:flex-nowrap justify-center overflow-hidden pb-3">
                            {text2Words.map((word, i) => (
                                <motion.span
                                    key={`w2-${i}`}
                                    variants={itemVariants}
                                    className={`text-gradient-static inline-block ${i !== text2Words.length - 1 ? 'mr-[0.3em]' : ''}`}
                                    style={{
                                        backgroundSize: `${text2Words.length * 100}% 100%`,
                                        backgroundPosition: `${(i / (text2Words.length - 1)) * 100}% center`
                                    }}
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-xl text-[--color-text-secondary]">
                        CaptureAI reads your screen, understands the context, and delivers the correct answer in seconds. Bypasses detection. Works everywhere.
                    </motion.p>

                    {/* CTA */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
                        <MagneticButton>
                            <MotionLink
                                href="/activate"
                                whileTap={{ scale: 0.98 }}
                                className="glow-btn inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white transition-all hover:from-[#1a5cff] hover:to-[#00f0ff] md:px-14 md:py-5 md:text-lg hover:shadow-[0_0_40px_rgba(0,71,255,0.4)]"
                            >
                                Get Started Now
                                <ArrowRight className="h-5 w-5" />
                            </MotionLink>
                        </MagneticButton>
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[--color-text-secondary] transition-colors hover:text-cyan-400"
                        >
                            Explore features
                        </a>
                    </motion.div>
                </motion.div>

                {/* Platform logos */}
                <motion.div
                    className="mt-28 w-full"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                >
                    <p className="mb-8 text-center text-[13px] font-semibold tracking-widest uppercase text-[--color-text-tertiary]">
                        Undetectable on every learning platform
                    </p>
                    <PlatformMarquee logos={platformLogos} />
                </motion.div>
            </div>
        </section>
    )
}

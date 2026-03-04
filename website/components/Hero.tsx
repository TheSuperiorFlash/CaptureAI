'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, Variants, useReducedMotion, useMotionValue, useSpring, useTransform, useAnimationFrame } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import MagneticButton from './MagneticButton'
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

    // Interactive Mouse Glow
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const handleMouseMove = (e: React.MouseEvent) => {
        const { currentTarget, clientX, clientY } = e
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left - width / 2)
        mouseY.set(clientY - top - height / 2)
    }

    const springConfig = { damping: 40, stiffness: 100, mass: 2 }
    const glowX1 = useSpring(useTransform(mouseX, x => !shouldReduceMotion ? x * 0.3 : 0), springConfig)
    const glowY1 = useSpring(useTransform(mouseY, y => !shouldReduceMotion ? y * 0.3 : 0), springConfig)
    const glowX2 = useSpring(useTransform(mouseX, x => !shouldReduceMotion ? x * -0.2 : 0), springConfig)
    const glowY2 = useSpring(useTransform(mouseY, y => !shouldReduceMotion ? y * -0.2 : 0), springConfig)

    const text1Words = "Screenshot any question.".split(' ')
    const text2Words = "Get the exact answer.".split(' ')

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])



    return (
        <section
            className="relative overflow-x-clip pb-32 pt-24 md:pb-48 md:pt-48"
            onMouseMove={handleMouseMove}
        >
            {/* Layered deeper gradient background with smooth fade-out */}
            <div className="pointer-events-none absolute -inset-x-0 top-0 bottom-[-400px] z-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
                <div className="absolute inset-0 aurora-bg" />
                <motion.div
                    className="absolute left-[50%] top-[-200px] h-[800px] w-[1000px] -ml-[500px] rounded-full bg-[#0047ff] gradient-blur gradient-blur-animated animate-pulse-glow motion-reduce:animate-none"
                    style={{ x: glowX1, y: glowY1, opacity: (isMounted && shouldReduceMotion) ? 0.2 : 0.8 }}
                />
                <motion.div
                    className="absolute right-[-100px] top-[50px] h-[600px] w-[600px] rounded-full bg-[#00f0ff] gradient-blur gradient-blur-animated animate-float-slow motion-reduce:animate-none"
                    style={{ x: glowX2, y: glowY2, opacity: (isMounted && shouldReduceMotion) ? 0.08 : 0.3 }}
                />
                <div className="absolute bottom-[100px] left-[-150px] h-[450px] w-[450px] rounded-full bg-[#0d3bbf] gradient-blur gradient-blur-animated animate-pulse-glow motion-reduce:animate-none" style={isMounted ? { animationDelay: shouldReduceMotion ? '0s' : '2s', opacity: shouldReduceMotion ? 0.18 : 0.7 } : { opacity: 0.7 }} />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <motion.div
                    className="mx-auto max-w-4xl text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="glass mb-8 inline-flex items-center gap-3 rounded-full px-4 py-1.5 border-cyan-500/20 bg-[#060913]/80">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                        </span>
                        <span className="text-[13px] font-semibold tracking-wide text-cyan-50">Chrome Extension</span>
                        <span className="h-3 w-px bg-[--color-border]" />
                        <span className="text-[13px] font-medium text-[--color-text-tertiary]">Free to start</span>
                    </motion.div>

                    <motion.h1 className="mb-4 drop-shadow-[0_4px_32px_rgba(0,0,0,0.85)] flex flex-col items-center text-[5.5vw] min-[400px]:text-3xl sm:text-5xl font-extrabold tracking-tight md:text-7xl lg:text-[5rem] lg:leading-[1.1]">
                        <div className="flex flex-nowrap justify-center overflow-hidden pb-1 text-[--color-text]">
                            {text1Words.map((word, i) => (
                                <motion.span key={`w1-${i}`} variants={itemVariants} className="mr-[0.3em] inline-block">
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                        <div className="flex flex-wrap justify-center overflow-hidden pb-3 max-w-[280px] sm:max-w-none">
                            {text2Words.map((word, i) => (
                                <motion.span
                                    key={`w2-${i}`}
                                    variants={itemVariants}
                                    className="text-gradient-static mr-[0.3em] inline-block"
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
                        <Link
                            href="/#features"
                            className="inline-flex items-center gap-2 text-[15px] font-semibold text-[--color-text-secondary] transition-colors hover:text-cyan-400"
                        >
                            Explore features
                        </Link>
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

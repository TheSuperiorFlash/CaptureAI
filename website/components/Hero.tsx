'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, Variants, useReducedMotion } from 'framer-motion'
import { useState, useEffect } from 'react'
const MotionLink = motion.create(Link)

const platformLogos = [
    { src: '/platforms/canvas.png', alt: 'Canvas', heightClass: 'h-8' },
    { src: '/platforms/respondus.png', alt: 'Respondus', heightClass: 'h-7' },
    { src: '/platforms/schoology.png', alt: 'Schoology', heightClass: 'h-8' },
    { src: '/platforms/moodle.png', alt: 'Moodle', heightClass: 'h-8' },
    { src: '/platforms/blackboard.png', alt: 'Blackboard', heightClass: 'h-5' },
]

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
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

export default function Hero() {
    const shouldReduceMotion = useReducedMotion()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    return (
        <section className="relative overflow-x-clip pb-32 pt-32 md:pb-48 md:pt-40">
            {/* Layered deeper gradient background with smooth fade-out */}
            <div className="pointer-events-none absolute -inset-x-0 top-0 bottom-[-400px] z-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
                <div className="absolute inset-0 aurora-bg" />
                <div className="absolute left-1/2 top-[-200px] h-[800px] w-[1000px] -translate-x-1/2 rounded-full bg-[#001e80] gradient-blur gradient-blur-animated animate-pulse-glow motion-reduce:animate-none motion-reduce:opacity-100" style={{ opacity: 0.08 }} />
                <div className="absolute right-[-100px] top-[50px] h-[500px] w-[500px] rounded-full bg-[#00f0ff] gradient-blur gradient-blur-animated animate-float-slow motion-reduce:animate-none motion-reduce:opacity-100" style={{ opacity: 0.05 }} />
                <div className="absolute bottom-[100px] left-[-150px] h-[450px] w-[450px] rounded-full bg-[#0d3bbf] gradient-blur gradient-blur-animated animate-pulse-glow motion-reduce:animate-none motion-reduce:opacity-100" style={isMounted ? { animationDelay: shouldReduceMotion ? '0s' : '2s', opacity: 0.08 } : { opacity: 0.08 }} />
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
                        <span className="text-[13px] font-semibold tracking-wide text-cyan-50 uppercase">Chrome Extension</span>
                        <span className="h-3 w-px bg-[--color-border]" />
                        <span className="text-[13px] font-medium text-[--color-text-tertiary]">Free to start</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={itemVariants} className="mb-4 drop-shadow-[0_4px_32px_rgba(0,0,0,0.85)]">
                        <span className="text-[--color-text]">Screenshot any question.</span>
                        <br />
                        <span className="text-gradient">Get the exact answer.</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-xl text-[--color-text-secondary]">
                        CaptureAI reads your screen, understands the context, and delivers the correct answer in seconds. Bypasses detection. Works everywhere.
                    </motion.p>

                    {/* CTA */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
                        <MotionLink
                            href="/activate"
                            whileTap={{ scale: 0.98 }}
                            className="glow-btn inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white transition-all hover:from-[#1a5cff] hover:to-[#00f0ff] md:px-14 md:py-5 md:text-lg hover:scale-[1.02] hover:-translate-y-0.5"
                        >
                            Get Started Now
                            <ArrowRight className="h-5 w-5" />
                        </MotionLink>
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
                    className="mt-28"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                >
                    <p className="mb-8 text-center text-[13px] font-semibold tracking-widest uppercase text-[--color-text-tertiary]">
                        Undetectable on every learning platform
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
                        {platformLogos.map((platform, i) => (
                            <motion.div
                                key={platform.alt}
                                className="opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 0.4, y: [0, -4, 0] }}
                                transition={{
                                    opacity: { delay: 1 + (i * 0.1), duration: 0.5 },
                                    y: {
                                        repeat: Infinity,
                                        duration: 4,
                                        delay: i * 0.6,
                                        ease: "easeInOut"
                                    }
                                }}
                                whileHover={{ opacity: 1, filter: "grayscale(0%)", transition: { duration: 0.3 } }}
                            >
                                <Image
                                    src={platform.src}
                                    alt={platform.alt}
                                    width={120}
                                    height={40}
                                    className={`${platform.heightClass} w-auto`}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

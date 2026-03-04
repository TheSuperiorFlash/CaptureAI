'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X as XIcon, Minus } from 'lucide-react'
import { ScrollReveal, ScrollRevealStagger, ScrollRevealItem } from './ScrollReveal'

export default function Pricing() {
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro'>('pro')
    const [touchStart, setTouchStart] = useState<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return
        const touchEnd = e.changedTouches[0].clientX
        const diff = touchStart - touchEnd
        if (diff > 40) setSelectedTier('pro') // swipe left sets pro
        if (diff < -40) setSelectedTier('free') // swipe right sets free
        setTouchStart(null)
    }

    return (
        <section id="pricing" className="relative py-24 md:py-32 overflow-x-clip">
            <div className="divider-gradient absolute left-0 right-0 top-0" />
            <div className="mx-auto max-w-6xl px-6">
                <ScrollReveal delay={0.1} className="mx-auto mb-16 max-w-xl text-center">
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Simple </span>
                        <span className="text-gradient-static">pricing</span>
                    </h2>
                    <p className="text-lg text-[--color-text-secondary]">
                        Start free. Upgrade when you need more.
                    </p>
                </ScrollReveal>

                <div
                    className="mx-auto grid grid-cols-1 w-full max-w-3xl md:gap-8 md:grid-cols-2 perspective-[1200px]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Free */}
                    <div
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center md:self-start ${selectedTier === 'free'
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100'
                            : 'z-10 -translate-x-12 sm:-translate-x-16 scale-[0.85] -rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('free')}
                    >
                        <ScrollRevealItem className={`glass-card flex w-full h-full flex-col rounded-3xl p-8 transition-colors ${selectedTier === 'free' ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.08)]' : ''}`}>
                            <h3 className="mb-1 text-xl text-[--color-text]">Free</h3>
                            <div className="mb-7">
                                <span className="text-4xl font-bold font-inter text-[--color-text]">$0</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                            </div>

                            <ul className="mb-8 space-y-3.5 flex-1">
                                <li className="flex items-start gap-3">
                                    <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" aria-hidden="true" />
                                    <span className="text-sm text-[--color-text-secondary]">10 requests per day</span>
                                </li>
                                {[
                                    'Screenshot capture',
                                    'Floating interface',
                                    'Stealth Mode',
                                    'Works on any website',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                        <span className="text-sm text-[--color-text-secondary]">{item}</span>
                                    </li>
                                ))}
                                {[
                                    'Privacy Guard',
                                    'Ask Mode',
                                    'Auto-Solve',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 opacity-30">
                                        <XIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                        <span className="text-sm text-[--color-text-tertiary]">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/activate"
                                className="glass mt-auto block rounded-xl py-3.5 text-center text-[15px] font-medium text-[--color-text-secondary] transition-all hover:text-[--color-text] hover:bg-white/[0.05] pointer-events-auto"
                            >
                                Get Started
                            </Link>
                        </ScrollRevealItem>
                    </div>

                    {/* Pro — premium gradient treatment */}
                    <div
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative rounded-[24px] glow-blue transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center md:self-start ${selectedTier === 'pro'
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:-translate-y-1'
                            : 'z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('pro')}
                    >
                        <ScrollRevealItem className={`flex h-full w-full flex-col rounded-[24px] p-[1px] ${selectedTier === 'pro' ? 'border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.25)]' : 'border-cyan-500/20 md:hover:-translate-y-1 md:hover:border-cyan-400/50 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]'}`}>
                            <div className="relative flex flex-1 w-full flex-col rounded-[23px] bg-gradient-to-b from-[#0a1128] to-[#040715] p-8">
                                <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 text-xs font-bold tracking-wide text-cyan-400">
                                    POPULAR
                                </span>
                                <h3 className="mb-1 text-xl text-[--color-text]">Pro</h3>
                                <div className="mb-7">
                                    <span className="text-4xl font-bold font-inter text-gradient-static">$9.99</span>
                                    <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                                </div>

                                <ul className="mb-8 space-y-3.5 flex-1">
                                    {[
                                        'Unlimited requests',
                                        'Screenshot capture',
                                        'Floating interface',
                                        'Stealth Mode',
                                        'Works on any website',
                                        'Privacy Guard',
                                        'Ask Mode',
                                        'Auto-Solve',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
                                            <span className="text-sm text-[--color-text-secondary]">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/activate"
                                    className="glow-btn mt-auto block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 hover:scale-105 hover:-translate-y-1 pointer-events-auto"
                                >
                                    Get Pro
                                </Link>
                            </div>
                        </ScrollRevealItem>
                    </div>
                </div>
            </div>
        </section>
    )
}

'use client'

import Link from 'next/link'
import { Check, X as XIcon, Minus } from 'lucide-react'
import { ScrollReveal, ScrollRevealItem } from './ScrollReveal'
import { useSwipeTier } from '@/hooks/useSwipeTier'

export default function Pricing() {
    const { selectedTier, setSelectedTier, handleTouchStart, handleTouchEnd, handleTouchCancel } = useSwipeTier()

    return (
        <section id="pricing" className="relative py-24 md:py-32 overflow-x-clip">
            <div className="divider-gradient absolute left-0 right-0 top-0" />
            <div className="mx-auto max-w-6xl px-6">
                <ScrollReveal delay={0.1} className="mx-auto mb-10 md:mb-16 max-w-xl text-center">
                    <h2 className="mb-4">
                        <span className="text-[--color-text]">Simple </span>
                        <span className="text-gradient-static">pricing</span>
                    </h2>
                    <p className="text-lg text-[--color-text-secondary]">
                        Simple plans. Upgrade when you need more.
                    </p>
                    {/* Mobile Tier Toggle */}
                    <div className="flex md:hidden justify-center items-center gap-3 mt-8">
                        <span 
                            className={`text-sm tracking-wide transition-colors cursor-pointer ${selectedTier === 'basic' ? 'text-white font-medium drop-shadow-md' : 'text-white/40 hover:text-white/80'}`} 
                            onClick={() => setSelectedTier('basic')}
                        >
                            Basic
                        </span>
                        <button
                            type="button"
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none"
                            role="switch"
                            aria-checked={selectedTier === 'pro'}
                            onClick={() => setSelectedTier(selectedTier === 'basic' ? 'pro' : 'basic')}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${selectedTier === 'pro' ? 'translate-x-5 bg-cyan-400' : 'translate-x-0 bg-white/80'}`}
                            />
                        </button>
                        <span 
                            className={`text-sm tracking-wide transition-colors cursor-pointer ${selectedTier === 'pro' ? 'text-cyan-400 font-medium drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'text-cyan-400/40 hover:text-cyan-400/80'}`} 
                            onClick={() => setSelectedTier('pro')}
                        >
                            Pro
                        </span>
                    </div>
                </ScrollReveal>

                <div
                    className="mx-auto grid grid-cols-1 w-full max-w-3xl md:gap-8 md:grid-cols-2 perspective-[1200px]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                >
                    {/* Basic */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'basic'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === 'basic'
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100'
                            : 'z-10 -translate-x-12 sm:-translate-x-16 scale-[0.85] -rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('basic')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('basic'); } }}
                    >
                        <ScrollRevealItem className={`glass-card flex w-full h-full flex-col rounded-3xl p-8 transition-all duration-500 ${selectedTier === 'basic' ? '!border-blue-500/30 !shadow-[0_0_30px_rgba(59,130,246,0.08)] md:border-transparent md:shadow-none md:hover:-translate-y-1 md:hover:!border-blue-500/30 md:hover:!shadow-[0_0_30px_rgba(59,130,246,0.08)]' : 'md:hover:-translate-y-1 md:hover:!border-blue-500/30 md:hover:!shadow-[0_0_30px_rgba(59,130,246,0.08)]'}`}>
                            <h3 className="mb-1 text-xl text-[--color-text]">Basic</h3>
                            <div className="mb-7">
                                <span className="text-4xl font-bold font-inter text-[--color-text]">$1.49</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / week</span>
                            </div>

                            <ul className="mb-8 space-y-3.5 flex-1">
                                <li className="flex items-start gap-3">
                                    <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" aria-hidden="true" />
                                    <span className="text-sm text-[--color-text-secondary]">50 requests per day</span>
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
                                className="glass mt-auto block rounded-xl py-3.5 text-center text-[15px] font-medium text-[--color-text-secondary] transition-colors hover:text-[--color-text] hover:!bg-white/[0.05] pointer-events-auto"
                            >
                                Get Basic
                            </Link>
                        </ScrollRevealItem>
                    </div>

                    {/* Pro — premium gradient treatment */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'pro'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative rounded-[24px] transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === 'pro'
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:translate-y-0'
                            : 'z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('pro')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('pro'); } }}
                    >
                        <ScrollRevealItem className={`flex h-full w-full flex-col rounded-[24px] transition-all duration-300 ${selectedTier === 'pro' ? 'shadow-[0_0_40px_rgba(0,240,255,0.25)] md:shadow-none md:hover:-translate-y-1 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]' : 'md:hover:-translate-y-1 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]'}`}>
                            <div className={`glow-blue relative flex flex-1 w-full flex-col rounded-[24px] bg-gradient-to-b from-[#0a1128]/95 to-[#040715]/95 backdrop-blur-[12px] p-8 border transition-all duration-300 ${selectedTier === 'pro' ? 'border-cyan-400/50' : 'border-white/10 sm:hover:border-cyan-400/50'}`}>
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
                                    className="glow-btn mt-auto block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-center text-[15px] font-semibold text-white transition-colors duration-300 hover:from-blue-500 hover:to-cyan-500 pointer-events-auto"
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

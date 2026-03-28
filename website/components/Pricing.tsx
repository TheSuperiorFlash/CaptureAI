'use client'

import { useState } from 'react'
import { AnimatedPrice } from '@/components/ui/animated-price'
import { Tab } from '@/components/ui/pricing-tab'
import Link from 'next/link'
import { Check, X as XIcon, Minus, Tag } from 'lucide-react'
import { ScrollReveal, ScrollRevealItem } from './ScrollReveal'
import { useSwipeTier } from '@/hooks/useSwipeTier'

const TIER_BASIC = 'basic'
const TIER_PRO = 'pro'

const PRICES = {
    basic: { weekly: 1.99, monthly: 5.99 },
    pro: { weekly: 3.49, monthly: 9.99 },
}

export default function Pricing() {
    const { selectedTier, setSelectedTier, handleTouchStart, handleTouchEnd, handleTouchCancel } = useSwipeTier()
    const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly')

    const basicPrice = PRICES.basic[billingPeriod]
    const proPrice = PRICES.pro[billingPeriod]
    const periodLabel = billingPeriod === 'monthly' ? 'mo' : 'wk'
    const direction = (billingPeriod === 'monthly' ? 1 : -1) as 1 | -1

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

                    {/* Billing period toggle */}
                    <div className="flex justify-center mt-8">
                        <div className="flex w-fit rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.08]">
                            {(['weekly', 'monthly'] as const).map((period) => (
                                <Tab
                                    key={period}
                                    text={period}
                                    selected={billingPeriod === period}
                                    setSelected={(v) => setBillingPeriod(v as 'weekly' | 'monthly')}
                                    discount={period === 'monthly'}
                                    discountLabel="Save 30%"
                                />
                            ))}
                        </div>
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
                        aria-pressed={selectedTier === TIER_BASIC}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative transition duration-300 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === TIER_BASIC
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100'
                            : 'z-10 -translate-x-12 sm:-translate-x-16 scale-[0.85] -rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier(TIER_BASIC)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier(TIER_BASIC); } }}
                    >
                        <ScrollRevealItem className={`glass-card flex w-full h-full flex-col rounded-3xl p-8 transition-[border-color,box-shadow,background,translate] duration-300 ${selectedTier === TIER_BASIC ? '!bg-[linear-gradient(145deg,rgb(11,17,32)_0%,rgb(6,9,19)_100%)] md:!bg-none !border-blue-500/30 !shadow-[0_0_30px_rgba(59,130,246,0.08)] md:border-transparent md:shadow-none md:hover:-translate-y-1 md:hover:!border-blue-500/30 md:hover:!shadow-[0_0_30px_rgba(59,130,246,0.08)]' : '!border-white/20 md:!border-transparent md:hover:-translate-y-1 md:hover:!border-blue-500/30 md:hover:!shadow-[0_0_30px_rgba(59,130,246,0.08)]'}`}>
                            <h3 className="mb-1 text-xl text-[--color-text]">Basic</h3>
                            <div className="mb-7">
                                <AnimatedPrice
                                    price={basicPrice}
                                    period={periodLabel}
                                    direction={direction}
                                    priceClassName="text-4xl font-bold font-inter text-[--color-text]"
                                    periodClassName="text-sm text-[--color-text-tertiary] ml-0.5"
                                />
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
                                href={`/activate?tier=basic&billing=${billingPeriod}`}
                                className="glass mt-auto block rounded-xl py-3.5 text-center text-[15px] font-medium text-[--color-text-secondary] transition-[color,background-color,scale] duration-150 hover:text-[--color-text] hover:!bg-white/[0.05] active:scale-[0.98] pointer-events-auto"
                            >
                                Get Basic
                            </Link>
                        </ScrollRevealItem>
                    </div>

                    {/* Pro — premium gradient treatment */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === TIER_PRO}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative rounded-[24px] transition duration-300 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === TIER_PRO
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:translate-y-0'
                            : 'z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier(TIER_PRO)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier(TIER_PRO); } }}
                    >
                        <ScrollRevealItem className={`flex h-full w-full flex-col rounded-[24px] transition-all duration-300 ${selectedTier === TIER_PRO ? 'shadow-[0_0_40px_rgba(0,240,255,0.25)] md:shadow-none md:hover:-translate-y-1 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]' : 'md:hover:-translate-y-1 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]'}`}>
                            <div className={`glow-blue relative flex flex-1 w-full flex-col rounded-[24px] bg-gradient-to-b from-[#0a1128]/95 to-[#040715]/95 backdrop-blur-[12px] p-8 border transition-all duration-300 ${selectedTier === TIER_PRO ? 'border-cyan-400/50' : 'border-white/20 sm:hover:border-cyan-400/50'}`}>
                                <div className="absolute top-[0.875rem] left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                    <Tag className="h-3.5 w-3.5 text-cyan-400 mb-0.5" />
                                    <span className="text-xs font-semibold text-cyan-400 tracking-wide">Introductory pricing</span>
                                </div>
                                <span className="absolute right-6 top-9 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 text-xs font-bold tracking-wide text-cyan-400">
                                    POPULAR
                                </span>
                                <h3 className="mb-1 text-xl text-[--color-text]">Pro</h3>
                                <div className="mb-7 flex items-end gap-2">
                                    <div className="flex items-end">
                                        <AnimatedPrice
                                            price={billingPeriod === 'monthly' ? 2.99 : 0.99}
                                            period={periodLabel}
                                            direction={direction}
                                            priceClassName="text-4xl font-extrabold font-inter text-gradient-static"
                                            periodClassName="text-sm text-[--color-text-tertiary] ml-0.5"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <span className="text-2xl font-bold font-inter line-through text-[--color-text-tertiary] opacity-40">{billingPeriod === 'monthly' ? '$9.99' : '$3.49'}</span>
                                        <span className="text-sm text-[--color-text-tertiary] opacity-40 mb-0.5 ml-0.5">{billingPeriod === 'monthly' ? '/mo' : '/wk'}</span>
                                    </div>
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
                                    href={`/activate?tier=pro&billing=${billingPeriod}`}
                                    className="glow-btn mt-auto block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-center text-[15px] font-semibold text-white transition-[scale,box-shadow] duration-300 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] pointer-events-auto"
                                >
                                    Try Pro — $0.99 first week
                                </Link>
                            </div>
                        </ScrollRevealItem>
                    </div>
                </div>

                {/* Mobile swipe affordance */}
                <div className="flex flex-col items-center gap-2 mt-5 md:hidden">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedTier(TIER_BASIC)}
                            aria-label="Select Basic plan"
                            className={`h-2 rounded-full transition-[width,background-color] duration-300 ${selectedTier === TIER_BASIC ? 'w-5 bg-white' : 'w-2 bg-white/30'}`}
                        />
                        <button
                            onClick={() => setSelectedTier(TIER_PRO)}
                            aria-label="Select Pro plan"
                            className={`h-2 rounded-full transition-[width,background-color] duration-300 ${selectedTier === TIER_PRO ? 'w-5 bg-cyan-400' : 'w-2 bg-white/30'}`}
                        />
                    </div>
                    <p className="text-xs text-[--color-text-tertiary]">Swipe to compare</p>
                </div>
            </div>
        </section>
    )
}

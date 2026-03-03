import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import FAQ from '@/components/FAQ'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollReveal, ScrollRevealStagger, ScrollRevealItem } from '@/components/ScrollReveal'
import ScrollStory from '@/components/ScrollStory'
import { ArrowRight, Check, X as XIcon, Minus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, and every learning platform.',
    openGraph: {
        title: 'CaptureAI - AI-Powered Screenshot Answers for Students',
        description: 'Screenshot any question and get instant AI-powered answers. Works on every learning platform.',
        images: ['/og-image.png'],
    },
}

export default function Home() {
    // Static JSON-LD structured data - no user input, safe for dangerouslySetInnerHTML
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'CaptureAI',
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Chrome',
        offers: [
            { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
            { '@type': 'Offer', price: '9.99', priceCurrency: 'USD', name: 'Pro' },
        ],
        description: 'Chrome extension that screenshots any question and gives you the answer instantly.',
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Hero />

            {/* Apple-Style Story Sequence */}
            <ScrollStory />

            {/* ---- Floating UI Showcase ---- */}
            <section className="relative py-24 md:py-32">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Image with glow frame */}
                        <ScrollReveal delay={0.1} className="relative">
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-600/30 via-transparent to-cyan-400/20 blur-md" />
                            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-blue-900/20">
                                <Image
                                    src="/floating-ui.png"
                                    alt="CaptureAI floating interface on a webpage"
                                    width={600}
                                    height={600}
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="block h-auto w-full"
                                />
                            </div>
                        </ScrollReveal>

                        {/* Copy */}
                        <ScrollReveal delay={0.2}>
                            <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                                Always accessible
                            </span>
                            <h2 className="mb-5 text-[--color-text]">
                                A floating panel that stays out of your way
                            </h2>
                            <p className="mb-4 leading-relaxed text-[--color-text-secondary]">
                                The CaptureAI interface sits on top of any webpage as a small, draggable button. Click it to open the capture tool, view your last answer, or adjust settings.
                            </p>
                            <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                                No need to open the extension popup or switch tabs. It&apos;s always one click away, on every site you visit.
                            </p>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* ---- Privacy Guard Showcase ---- */}
            <section className="relative py-24 md:py-32">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="pointer-events-none absolute inset-0 aurora-bg opacity-40" />
                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    {/* Header */}
                    <ScrollReveal delay={0.1} className="mx-auto mb-14 max-w-2xl text-center">
                        <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            Pro feature
                        </span>
                        <h2 className="mb-4 text-[--color-text]">Privacy Guard</h2>
                        <p className="text-[--color-text-secondary]">
                            Quiz platforms can log browser extension activity. Privacy Guard intercepts those detection methods so your activity logs stay clean.
                        </p>
                    </ScrollReveal>

                    {/* Before / After comparison */}
                    <ScrollRevealStagger delay={0.2} className="grid gap-6 md:grid-cols-2">
                        {/* Without */}
                        <ScrollRevealItem className="glass-card overflow-hidden rounded-2xl p-5">
                            <div className="mb-4 flex items-center gap-2.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15">
                                    <XIcon className="h-3.5 w-3.5 text-red-400" />
                                </span>
                                <span className="text-sm font-medium text-[--color-text-secondary]">Privacy Guard off</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-white/[0.04]">
                                <Image
                                    src="/action-log-canvas-1.png"
                                    alt="Canvas action log showing extension activity detected"
                                    width={600}
                                    height={600}
                                    className="block h-auto w-full"
                                />
                            </div>
                            <p className="mt-4 text-sm text-[--color-text-tertiary]">
                                Extension activity visible in platform logs
                            </p>
                        </ScrollRevealItem>

                        {/* With */}
                        <ScrollRevealItem className="glass-card overflow-hidden rounded-2xl p-5">
                            <div className="mb-4 flex items-center gap-2.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                </span>
                                <span className="text-sm font-medium text-[--color-text-secondary]">Privacy Guard on</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-white/[0.04]">
                                <Image
                                    src="/action-log-canvas-2.png"
                                    alt="Canvas action log showing clean browsing activity"
                                    width={600}
                                    height={600}
                                    className="block h-auto w-full"
                                />
                            </div>
                            <p className="mt-4 text-sm text-[--color-text-tertiary]">
                                Logs show only normal browsing activity
                            </p>
                        </ScrollRevealItem>
                    </ScrollRevealStagger>
                </div>
            </section>

            <Features />

            <HowItWorks />

            {/* ---- Pricing ---- */}
            <section id="pricing" className="relative py-24 md:py-32">
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

                    <ScrollRevealStagger delay={0.2} className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
                        {/* Free */}
                        <ScrollRevealItem className="glass-card flex flex-col self-start rounded-3xl p-8">
                            <h3 className="mb-1 text-xl text-[--color-text]">Free</h3>
                            <div className="mb-7">
                                <span className="text-4xl font-bold text-[--color-text]">$0</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                            </div>

                            <ul className="mb-8 space-y-3.5">
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
                                className="glass block rounded-xl py-3.5 text-center text-[15px] font-medium text-[--color-text-secondary] transition-all hover:text-[--color-text] hover:bg-white/[0.05]"
                            >
                                Get Started
                            </Link>
                        </ScrollRevealItem>

                        {/* Pro — premium gradient treatment */}
                        <ScrollRevealItem className="gradient-border relative flex self-start rounded-3xl glow-blue transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_0_60px_rgba(0,113,255,0.4)] z-10">
                            <div className="relative flex flex-1 flex-col rounded-3xl bg-gradient-to-b from-[#0a1128] to-[#040715] p-8">
                                <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 text-xs font-bold tracking-wide text-cyan-400 border border-cyan-500/20">
                                    POPULAR
                                </span>
                                <h3 className="mb-1 text-xl text-[--color-text]">Pro</h3>
                                <div className="mb-7">
                                    <span className="text-4xl font-bold text-gradient-static">$9.99</span>
                                    <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                                </div>

                                <ul className="mb-8 space-y-3.5">
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
                                    className="glow-btn block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 hover:scale-105 hover:-translate-y-1"
                                >
                                    Get Pro
                                </Link>
                            </div>
                        </ScrollRevealItem>
                    </ScrollRevealStagger>
                </div>
            </section>

            <FAQ />

            {/* ---- Final CTA ---- */}
            <section className="relative overflow-hidden py-32 md:py-48">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                {/* Background glow */}
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />
                <div className="absolute left-[30%] top-[30%] h-[400px] w-[400px] rounded-full bg-cyan-500 gradient-blur" />

                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    <ScrollReveal delay={0.1} className="mx-auto max-w-xl text-center">
                        <h2 className="mb-5">
                            <span className="text-[--color-text]">Ready to </span>
                            <span className="text-gradient-static">try it?</span>
                        </h2>
                        <p className="mb-10 text-lg text-[--color-text-secondary]">
                            Install the extension, get a license key, and start getting answers in under a minute.
                        </p>
                        <Link
                            href="/activate"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white transition-all shadow-[0_0_20px_rgba(0,71,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3),inset_0_0_0_1px_rgba(255,255,255,0.2)] hover:from-[#1a5cff] hover:to-[#00f0ff] md:px-14 md:py-5 md:text-lg hover:scale-[1.02] hover:-translate-y-0.5"
                        >
                            Get Started
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </ScrollReveal>
                </div>
            </section>
        </>
    )
}

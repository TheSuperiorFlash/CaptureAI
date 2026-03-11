import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import FAQ from '@/components/FAQ'
import Link from 'next/link'
import Image from 'next/image'
import { ScrollReveal, ScrollRevealStagger, ScrollRevealItem } from '@/components/ScrollReveal'
import ScrollStory from '@/components/ScrollStory'
import { ArrowRight, Check, X as XIcon } from 'lucide-react'
import type { Metadata } from 'next'
import MagneticButton from '@/components/MagneticButton'
import PrivacyGuardSlider from '@/components/PrivacyGuardSlider'
import Pricing from '@/components/Pricing'
import FloatingUIShowcase from '@/components/FloatingUIShowcase'

export const metadata: Metadata = {
    description: 'Chrome extension that screenshots any question and gives you the answer instantly. Works on Canvas, Moodle, Blackboard, Top Hat, and every learning platform.',
    openGraph: {
        title: 'CaptureAI - AI-Powered Screenshot Answers for Students',
        description: 'Screenshot any question and get instant AI-powered answers. Works on Canvas, Moodle, Blackboard, Top Hat, and every learning platform.',
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
            { '@type': 'Offer', price: '1.49', priceCurrency: 'USD', name: 'Basic' },
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
            <section className="relative py-32 md:py-42 overflow-x-clip">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid items-start gap-12 lg:grid-cols-2">
                        {/* Popup is absolutely positioned so it never affects section height, but needs mobile height to prevent text overlap */}
                        <ScrollReveal delay={0.1} className="relative h-[320px] lg:h-0">
                            <div className="absolute inset-0 flex items-start justify-center" style={{ overflow: 'visible', pointerEvents: 'none', top: -50 }}>
                                <div style={{ pointerEvents: 'auto' }} className="scale-[0.80] origin-top md:scale-100">
                                    <FloatingUIShowcase />
                                </div>
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
            <section className="relative py-24 md:py-32 overflow-x-clip">
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

                    <PrivacyGuardSlider />

                    {/* Before / After comparison */}
                    <ScrollRevealStagger delay={0.2} stagger={0} className="hidden md:grid gap-6 md:grid-cols-2">
                        {/* Without */}
                        <ScrollRevealItem className="glass-card overflow-hidden rounded-2xl p-5" transition={{ type: "spring", stiffness: 40, damping: 20 }}>
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
                        <ScrollRevealItem className="glass-card overflow-hidden rounded-2xl p-5" transition={{ type: "spring", stiffness: 40, damping: 20 }}>
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
            <Pricing />

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
                        <MagneticButton>
                            <Link
                                href="/activate"
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047ff] to-[#1a5cff] px-10 py-4 text-base font-bold tracking-wide text-white transition-all hover:from-[#1a5cff] hover:to-[#00f0ff] md:px-14 md:py-5 md:text-lg hover:shadow-[0_0_40px_rgba(0,71,255,0.4)]"
                            >
                                Get Started
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </MagneticButton>
                    </ScrollReveal>
                </div>
            </section>
        </>
    )
}

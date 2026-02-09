import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import FAQ from '@/components/FAQ'
import Link from 'next/link'
import Image from 'next/image'
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
    return (
        <>
            <Hero />

            {/* ---- Floating UI Showcase ---- */}
            <section className="relative py-24 md:py-32">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Image with glow frame */}
                        <div className="relative">
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/10 blur-sm" />
                            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
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
                        </div>

                        {/* Copy */}
                        <div>
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
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- Privacy Guard Showcase ---- */}
            <section className="relative py-24 md:py-32">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="pointer-events-none absolute inset-0 gradient-section" />
                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    {/* Header */}
                    <div className="mx-auto mb-14 max-w-2xl text-center">
                        <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            Pro feature
                        </span>
                        <h2 className="mb-4 text-[--color-text]">Privacy Guard</h2>
                        <p className="text-[--color-text-secondary]">
                            Quiz platforms can log browser extension activity. Privacy Guard intercepts those detection methods so your activity logs stay clean.
                        </p>
                    </div>

                    {/* Before / After comparison */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Without */}
                        <div className="glass-card overflow-hidden rounded-2xl p-5">
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
                        </div>

                        {/* With */}
                        <div className="glass-card overflow-hidden rounded-2xl p-5">
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
                        </div>
                    </div>
                </div>
            </section>

            <Features />

            <HowItWorks />

            {/* ---- Pricing ---- */}
            <section id="pricing" className="relative py-24 md:py-32">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto mb-16 max-w-xl text-center">
                        <h2 className="mb-4">
                            <span className="text-[--color-text]">Simple </span>
                            <span className="text-gradient-static">pricing</span>
                        </h2>
                        <p className="text-[--color-text-secondary]">
                            Start free. Upgrade when you need more.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {/* Free */}
                        <div className="glass-card flex flex-col self-start rounded-2xl p-7">
                            <h3 className="mb-1 text-[--color-text]">Free</h3>
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
                                className="glass block rounded-xl py-3 text-center text-sm font-medium text-[--color-text-secondary] transition-all hover:text-[--color-text]"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Pro — gradient border treatment */}
                        <div className="gradient-border relative flex self-start rounded-2xl">
                            <div className="relative flex flex-1 flex-col rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-7">
                                <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
                                    Popular
                                </span>
                                <h3 className="mb-1 text-[--color-text]">Pro</h3>
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
                                    className="glow-btn block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                                >
                                    Get Pro
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQ />

            {/* ---- Final CTA ---- */}
            <section className="relative overflow-hidden py-28 md:py-36">
                <div className="divider-gradient absolute left-0 right-0 top-0" />
                {/* Background glow */}
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />
                <div className="absolute left-[30%] top-[30%] h-[300px] w-[300px] rounded-full bg-cyan-500 gradient-blur" />

                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-lg text-center">
                        <h2 className="mb-5">
                            <span className="text-[--color-text]">Ready to </span>
                            <span className="text-gradient-static">try it?</span>
                        </h2>
                        <p className="mb-10 text-lg text-[--color-text-secondary]">
                            Install the extension, get a license key, and start getting answers in under a minute.
                        </p>
                        <Link
                            href="/activate"
                            className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-[15px] font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            Get Started
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}

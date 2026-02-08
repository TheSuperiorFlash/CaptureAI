import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import FAQ from '@/components/FAQ'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, X as XIcon } from 'lucide-react'
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
            <section className="border-t border-[--color-border-subtle] py-20 md:py-28">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* Image */}
                        <div className="overflow-hidden rounded-xl border border-[--color-border]">
                            <Image
                                src="/floating-ui.png"
                                alt="CaptureAI floating interface on a webpage"
                                width={600}
                                height={600}
                                className="block h-auto w-full"
                            />
                        </div>

                        {/* Copy */}
                        <div>
                            <p className="mb-3 text-sm font-medium text-[--color-accent-hover]">Always accessible</p>
                            <h2 className="mb-4 text-[--color-text]">
                                A floating panel that stays out of your way
                            </h2>
                            <p className="mb-4 text-[--color-text-secondary]">
                                The CaptureAI interface sits on top of any webpage as a small, draggable button. Click it to open the capture tool, view your last answer, or adjust settings.
                            </p>
                            <p className="text-sm text-[--color-text-tertiary]">
                                No need to open the extension popup or switch tabs. It&apos;s always one click away, on every site you visit.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- Privacy Guard Showcase ---- */}
            <section className="border-t border-[--color-border-subtle] py-20 md:py-28">
                <div className="mx-auto max-w-6xl px-6">
                    {/* Header */}
                    <div className="mb-12">
                        <p className="mb-3 text-sm font-medium text-[--color-accent-hover]">Pro feature</p>
                        <h2 className="mb-3 text-[--color-text]">Privacy Guard</h2>
                        <p className="max-w-2xl text-[--color-text-secondary]">
                            Quiz platforms can log browser extension activity. Privacy Guard intercepts those detection methods so your activity logs stay clean.
                        </p>
                    </div>

                    {/* Before / After comparison */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Without */}
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10">
                                    <XIcon className="h-3 w-3 text-red-400" />
                                </span>
                                <span className="text-sm font-medium text-[--color-text-secondary]">Privacy Guard off</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-[--color-border]">
                                <Image
                                    src="/action-log-canvas-1.png"
                                    alt="Canvas action log showing extension activity detected"
                                    width={600}
                                    height={600}
                                    className="block h-auto w-full"
                                />
                            </div>
                            <p className="mt-3 text-sm text-[--color-text-tertiary]">
                                Extension activity visible in platform logs
                            </p>
                        </div>

                        {/* With */}
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                                    <Check className="h-3 w-3 text-green-400" />
                                </span>
                                <span className="text-sm font-medium text-[--color-text-secondary]">Privacy Guard on</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-[--color-border]">
                                <Image
                                    src="/action-log-canvas-2.png"
                                    alt="Canvas action log showing clean browsing activity"
                                    width={600}
                                    height={600}
                                    className="block h-auto w-full"
                                />
                            </div>
                            <p className="mt-3 text-sm text-[--color-text-tertiary]">
                                Logs show only normal browsing activity
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Features />

            <HowItWorks />

            {/* ---- Pricing ---- */}
            <section id="pricing" className="border-t border-[--color-border-subtle] py-20 md:py-28">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-14">
                        <h2 className="mb-3 text-[--color-text]">Pricing</h2>
                        <p className="text-[--color-text-secondary]">
                            Start free. Upgrade when you need more.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 md:max-w-3xl">
                        {/* Free */}
                        <div className="rounded-xl border border-[--color-border] p-6">
                            <h3 className="mb-1 text-[--color-text]">Free</h3>
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-[--color-text]">$0</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                            </div>

                            <ul className="mb-8 space-y-3">
                                {[
                                    '10 requests per day',
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
                                    'Unlimited requests',
                                    'Privacy Guard',
                                    'Ask Mode',
                                    'Auto-Solve',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 opacity-40">
                                        <XIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                        <span className="text-sm text-[--color-text-tertiary]">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/activate"
                                className="block rounded-lg border border-[--color-border] bg-transparent py-2.5 text-center text-sm font-medium text-[--color-text-secondary] transition-colors hover:border-[--color-text-tertiary] hover:text-[--color-text]"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="rounded-xl border border-[--color-accent-border] bg-[--color-accent-muted] p-6">
                            <div className="mb-1 flex items-center gap-3">
                                <h3 className="text-[--color-text]">Pro</h3>
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-[--color-text]">$9.99</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                            </div>

                            <ul className="mb-8 space-y-3">
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
                                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[--color-accent-hover]" />
                                        <span className="text-sm text-[--color-text-secondary]">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/activate"
                                className="block rounded-lg bg-[--color-accent] py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                            >
                                Get Pro
                            </Link>
                            <p className="mt-3 text-center text-xs text-[--color-text-tertiary]">
                                7-day money-back guarantee
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <FAQ />

            {/* ---- Final CTA ---- */}
            <section className="border-t border-[--color-border-subtle] py-20 md:py-28">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mx-auto max-w-lg text-center">
                        <h2 className="mb-4 text-[--color-text]">
                            Ready to try it?
                        </h2>
                        <p className="mb-8 text-[--color-text-secondary]">
                            Install the extension, get a free license key, and start getting answers in under a minute.
                        </p>
                        <Link
                            href="/activate"
                            className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}

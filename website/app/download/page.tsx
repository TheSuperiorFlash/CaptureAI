import type { Metadata } from 'next'
import Link from 'next/link'
import { Chrome, Check, Download, ArrowRight, Shield, Zap } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Download - CaptureAI',
    description: 'Download the CaptureAI Chrome extension. Free AI-powered screenshot answers for students.',
    openGraph: {
        title: 'Download CaptureAI',
        description: 'Free Chrome extension for students. Screenshot any question and get instant AI-powered answers.',
        images: ['/og-image.png'],
    },
}

const steps = [
    {
        title: 'Install from Chrome Web Store',
        desc: 'Click the button above to open the store listing, then click "Add to Chrome".',
    },
    {
        title: 'Get your license key',
        desc: 'Visit the activation page and enter your email to receive a free key.',
        link: { href: '/activate', text: 'captureai.dev/activate' },
    },
    {
        title: 'Activate the extension',
        desc: 'Open the CaptureAI extension popup, paste your license key, and you\'re ready to go.',
    },
    {
        title: 'Start capturing',
        desc: 'Press Ctrl+Shift+X to capture any area of your screen and get an instant answer.',
    },
]

export default function DownloadPage() {
    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-1/2 top-[5%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />

            <div className="relative z-10 mx-auto max-w-3xl px-6">
                {/* Header */}
                <div className="mb-14 text-center">
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        Chrome Extension
                    </span>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Get </span>
                        <span className="text-gradient-static">CaptureAI</span>
                    </h1>
                    <p className="text-[--color-text-secondary]">
                        Install the Chrome extension and start getting answers in under a minute.
                    </p>
                </div>

                {/* Download card */}
                <div className="gradient-border mb-10 rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10">
                                <Chrome className="h-7 w-7 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[--color-text]">Chrome Extension</h2>
                                <p className="text-sm text-[--color-text-tertiary]">Free to install — works on Google Chrome</p>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-cyan-400" />
                                <span className="text-sm text-[--color-text-tertiary]">Privacy-first</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-cyan-400" />
                                <span className="text-sm text-[--color-text-tertiary]">Instant answers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Download className="h-4 w-4 text-cyan-400" />
                                <span className="text-sm text-[--color-text-tertiary]">Lightweight</span>
                            </div>
                        </div>

                        <a
                            href="https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkpmmkecmoeomnjd?authuser=0&hl=en"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glow-btn flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-center text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            <Chrome className="h-4 w-4" />
                            Add to Chrome — Free
                        </a>
                    </div>
                </div>

                {/* Setup steps */}
                <div className="glass-card mb-10 rounded-2xl p-8">
                    <h3 className="mb-8 text-lg font-semibold text-[--color-text]">Setup in 4 steps</h3>
                    <ol className="space-y-6">
                        {steps.map((step, i) => (
                            <li key={i} className="flex gap-5">
                                <div className="relative flex-shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md" />
                                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                                        {i + 1}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-1 text-sm font-medium text-[--color-text]">{step.title}</h4>
                                    <p className="text-sm text-[--color-text-tertiary]">
                                        {step.link ? (
                                            <>
                                                {step.desc.split(step.link.text)[0]}
                                                <Link href={step.link.href} className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">
                                                    {step.link.text}
                                                </Link>
                                                {step.desc.split(step.link.text)[1]}
                                            </>
                                        ) : (
                                            step.desc
                                        )}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* System requirements */}
                <div className="glass-card rounded-2xl p-8">
                    <h4 className="mb-5 text-sm font-medium text-[--color-text-secondary]">System requirements</h4>
                    <ul className="space-y-3">
                        {[
                            'Google Chrome 88 or later',
                            'Internet connection',
                            'Free CaptureAI license key',
                        ].map((req) => (
                            <li key={req} className="flex items-center gap-3">
                                <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                                <span className="text-sm text-[--color-text-tertiary]">{req}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA */}
                <div className="mt-10 text-center">
                    <p className="mb-4 text-sm text-[--color-text-tertiary]">
                        Already installed? Get your license key to activate.
                    </p>
                    <Link
                        href="/activate"
                        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                    >
                        Get a license key
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

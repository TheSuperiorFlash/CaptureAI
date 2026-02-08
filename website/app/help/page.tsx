import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Keyboard, HelpCircle, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Help - CaptureAI',
    description: 'Learn how to use CaptureAI. Guides, keyboard shortcuts, and FAQ.',
}

export default function HelpPage() {
    return (
        <div className="relative overflow-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute right-[-100px] top-[20%] h-[400px] w-[400px] rounded-full bg-blue-600 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-3xl px-6">
                {/* Header */}
                <div className="mb-14 text-center">
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        Support
                    </span>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Help </span>
                        <span className="text-gradient-static">Center</span>
                    </h1>
                    <p className="mx-auto max-w-md text-[--color-text-secondary]">
                        Guides and answers for using CaptureAI.
                    </p>
                </div>

                {/* Getting Started */}
                <section className="glass-card mb-8 rounded-2xl p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10">
                            <BookOpen className="h-5 w-5 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[--color-text]">Getting Started</h2>
                    </div>

                    <div className="mb-8">
                        <h3 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Installation</h3>
                        <ol className="space-y-2.5">
                            {[
                                <>Install CaptureAI from the <a href="https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkpmmkecmoeomnjd?authuser=0&hl=en" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">Chrome Web Store</a></>,
                                <>Get your license key from the <Link href="/activate" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">activation page</Link></>,
                                'Open the extension popup and enter your license key',
                                'Start using CaptureAI on any webpage',
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-semibold text-blue-400">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-[--color-text-tertiary]">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="divider-gradient mb-8" />

                    <div>
                        <h3 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Basic usage</h3>
                        <ol className="space-y-2.5">
                            {[
                                'Click the floating CaptureAI button on any page',
                                'Select the area containing your question',
                                'Wait a moment while the AI analyzes the screenshot',
                                'Read the answer displayed on the page',
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] font-semibold text-cyan-400">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-[--color-text-tertiary]">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Keyboard Shortcuts */}
                <section className="glass-card mb-8 rounded-2xl p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10">
                            <Keyboard className="h-5 w-5 text-violet-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[--color-text]">Keyboard Shortcuts</h2>
                    </div>
                    <div className="space-y-3">
                        {[
                            { keys: 'Ctrl + Shift + X', action: 'Capture an area of the screen' },
                            { keys: 'Ctrl + Shift + F', action: 'Quick capture (full visible area)' },
                            { keys: 'Ctrl + Shift + E', action: 'Toggle the floating panel' },
                        ].map((shortcut) => (
                            <div key={shortcut.keys} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.02] px-5 py-3.5">
                                <span className="text-sm text-[--color-text-secondary]">{shortcut.action}</span>
                                <code className="whitespace-nowrap rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-cyan-400">
                                    {shortcut.keys}
                                </code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="glass-card mb-8 rounded-2xl p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10">
                            <HelpCircle className="h-5 w-5 text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[--color-text]">FAQ</h2>
                    </div>
                    <div className="space-y-6">
                        {[
                            {
                                q: 'How do I get a license key?',
                                a: <>Visit the <Link href="/activate" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">activation page</Link> and enter your email. You&apos;ll receive a key via email.</>,
                            },
                            {
                                q: 'What\'s the difference between Free and Pro?',
                                a: 'Free gives you 10 requests per day. Pro gives unlimited requests plus Privacy Guard, Ask Mode, and Auto-Solve for $9.99/month.',
                            },
                            {
                                q: 'Which browser is supported?',
                                a: 'CaptureAI works exclusively on Google Chrome. It uses Chrome-specific extension APIs.',
                            },
                            {
                                q: 'How do I upgrade to Pro?',
                                a: <>Visit the <Link href="/activate" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">activation page</Link> and select the Pro tier. You&apos;ll be redirected to Stripe for payment.</>,
                            },
                        ].map((item, i) => (
                            <div key={i} className={i > 0 ? 'border-t border-white/[0.04] pt-6' : ''}>
                                <h3 className="mb-2 text-sm font-medium text-[--color-text]">{item.q}</h3>
                                <p className="text-sm text-[--color-text-tertiary]">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10">
                            <MessageSquare className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="mb-2 text-[--color-text]">Still need help?</h3>
                        <p className="mx-auto mb-6 max-w-sm text-sm text-[--color-text-tertiary]">
                            Reach out and we&apos;ll get back to you within 24 hours.
                        </p>
                        <Link
                            href="/contact"
                            className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            Contact Support
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}

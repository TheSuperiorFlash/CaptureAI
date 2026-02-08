import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Help - CaptureAI',
    description: 'Learn how to use CaptureAI. Guides, keyboard shortcuts, and FAQ.',
}

export default function HelpPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="mb-3 text-[--color-text]">Help Center</h1>
                    <p className="text-[--color-text-secondary]">
                        Guides and answers for using CaptureAI.
                    </p>
                </div>

                {/* Getting Started */}
                <section className="mb-10 rounded-xl border border-[--color-border] p-6">
                    <h2 className="mb-5 text-lg font-semibold text-[--color-text]">Getting Started</h2>

                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Installation</h3>
                        <ol className="list-inside list-decimal space-y-2 text-sm text-[--color-text-tertiary]">
                            <li>Install CaptureAI from the Chrome Web Store</li>
                            <li>Get your license key from the <Link href="/activate" className="text-[--color-accent-hover] underline underline-offset-2">activation page</Link></li>
                            <li>Open the extension popup and enter your license key</li>
                            <li>Start using CaptureAI on any webpage</li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-medium text-[--color-text-secondary]">Basic usage</h3>
                        <ol className="list-inside list-decimal space-y-2 text-sm text-[--color-text-tertiary]">
                            <li>Click the floating CaptureAI button on any page</li>
                            <li>Select the area containing your question</li>
                            <li>Wait a moment while the AI analyzes the screenshot</li>
                            <li>Read the answer displayed on the page</li>
                        </ol>
                    </div>
                </section>

                {/* Keyboard Shortcuts */}
                <section className="mb-10 rounded-xl border border-[--color-border] p-6">
                    <h2 className="mb-5 text-lg font-semibold text-[--color-text]">Keyboard Shortcuts</h2>
                    <div className="space-y-3">
                        {[
                            { keys: 'Ctrl + Shift + X', action: 'Capture an area of the screen' },
                            { keys: 'Ctrl + Shift + F', action: 'Quick capture (full visible area)' },
                            { keys: 'Ctrl + Shift + E', action: 'Toggle the floating panel' },
                        ].map((shortcut) => (
                            <div key={shortcut.keys} className="flex items-center justify-between gap-4">
                                <span className="text-sm text-[--color-text-tertiary]">{shortcut.action}</span>
                                <code className="whitespace-nowrap rounded-md bg-[--color-surface] px-2.5 py-1 text-xs font-medium text-[--color-text-secondary]">
                                    {shortcut.keys}
                                </code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-10 rounded-xl border border-[--color-border] p-6">
                    <h2 className="mb-5 text-lg font-semibold text-[--color-text]">FAQ</h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: 'How do I get a license key?',
                                a: <>Visit the <Link href="/activate" className="text-[--color-accent-hover] underline underline-offset-2">activation page</Link> and enter your email. You&apos;ll receive a key via email.</>,
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
                                a: <>Visit the <Link href="/activate" className="text-[--color-accent-hover] underline underline-offset-2">activation page</Link> and select the Pro tier. You&apos;ll be redirected to Stripe for payment.</>,
                            },
                        ].map((item, i) => (
                            <div key={i}>
                                <h3 className="mb-1.5 text-sm font-medium text-[--color-text]">{item.q}</h3>
                                <p className="text-sm text-[--color-text-tertiary]">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="rounded-xl border border-[--color-border-subtle] p-6 text-center">
                    <h3 className="mb-2 text-[--color-text]">Still need help?</h3>
                    <p className="mb-5 text-sm text-[--color-text-tertiary]">
                        Reach out and we&apos;ll get back to you within 24 hours.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex rounded-lg bg-[--color-accent] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                    >
                        Contact Support
                    </Link>
                </section>
            </div>
        </div>
    )
}

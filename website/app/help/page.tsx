import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Keyboard, HelpCircle, MessageSquare, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Help & FAQ',
    description:
        'CaptureAI help center. Setup guides, troubleshooting for Canvas, Moodle, and Blackboard, keyboard shortcuts, and FAQ.',
    alternates: {
        canonical: '/help',
    },
}

const INLINE_LINK_CLASS = 'text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300';

type QaItem = { q: string; a: React.ReactNode };

const FAQ_ITEMS: QaItem[] = [
    {
        q: 'How do I get a license key?',
        a: <>Visit the <Link href="/activate" className={INLINE_LINK_CLASS}>activation page</Link> and enter your email. You&apos;ll receive a key via email after completing checkout.</>,
    },
    {
        q: 'What\'s the difference between Basic and Pro?',
        a: 'Basic gives you 50 AI requests per day for $1.49/week. Pro gives unlimited requests plus Privacy Guard, Ask Mode, and Auto-Solve for $9.99/month.',
    },
    {
        q: 'Which browser is supported?',
        a: 'CaptureAI works exclusively on Google Chrome (desktop). It uses Chrome-specific extension APIs that are not available in Firefox, Safari, or Edge.',
    },
    {
        q: 'How do I upgrade to Pro?',
        a: <>Visit the <Link href="/activate" className={INLINE_LINK_CLASS}>activation page</Link>, select Pro, and enter your email. If you already have an active subscription, you&apos;ll see a prorated amount so you only pay for the remaining time.</>,
    },
    {
        q: 'How do I cancel my subscription?',
        a: <>Open the CaptureAI extension popup, go to Settings, and click &ldquo;Manage Billing&rdquo; to access the Stripe billing portal where you can cancel anytime. Your access continues until the end of the billing period.</>,
    },
    {
        q: 'What is Privacy Guard?',
        a: 'Privacy Guard (Pro only) prevents exam proctoring platforms from detecting that you\'ve switched tabs, lost focus, or are using a browser extension. It overrides browser focus and visibility APIs at the page level.',
    },
    {
        q: 'Are my screenshots stored on your servers?',
        a: 'No. Screenshots are never stored on our servers. Text is extracted locally in your browser using Tesseract.js OCR. Only the extracted text (or image if OCR confidence is too low) is sent to the AI for analysis.',
    },
    {
        q: 'Do you offer refunds?',
        a: <>Refunds are considered on a case-by-case basis within 7 days of purchase. Email <a href="mailto:support@captureai.dev" className={INLINE_LINK_CLASS}>support@captureai.dev</a> with your order details.</>,
    },
];

const TROUBLESHOOTING_ITEMS: QaItem[] = [
    {
        q: 'The floating button isn\'t appearing on the page',
        a: 'Refresh the page after installing the extension. On some sites the content script loads after the page — pressing Ctrl+Shift+E will force the UI to appear. If it still doesn\'t show, check that the extension is enabled at chrome://extensions.',
    },
    {
        q: 'I paid but never received my license key',
        a: <>Check your spam/junk folder for an email from captureai.dev. Keys are sent immediately after Stripe confirms payment. If you still don&apos;t see it after 10 minutes, email <a href="mailto:support@captureai.dev" className={INLINE_LINK_CLASS}>support@captureai.dev</a> with your receipt.</>,
    },
    {
        q: 'The AI is giving wrong or irrelevant answers',
        a: 'Make sure you\'re capturing only the question text, not the entire page. Try zooming in on the question before capturing. If OCR is misreading text, open Settings in the popup and enable "Disable OCR Extraction" to send the image directly instead.',
    },
    {
        q: 'It says "Daily limit reached"',
        a: <>You&apos;ve used all 50 requests for today on the Basic plan. Your limit resets at midnight UTC. To get unlimited requests, <Link href="/activate" className={INLINE_LINK_CLASS}>upgrade to Pro</Link>.</>,
    },
    {
        q: 'The extension doesn\'t work on a specific site',
        a: 'Some sites use strict Content Security Policies that can interfere with extensions. CaptureAI cannot run on internal Chrome pages (chrome://, edge://) or the Chrome Web Store. For exam platforms, make sure Privacy Guard is enabled (Pro) if the site blocks extension activity.',
    },
    {
        q: 'My license key says "Invalid or expired"',
        a: <>Your subscription may have lapsed due to a failed payment. Open the CaptureAI extension popup, go to Settings, click &ldquo;Manage Billing&rdquo; to access the Stripe billing portal where you can check your subscription status and update your payment method.</>,
    },
    {
        q: 'Does CaptureAI work on locked-down browsers like Respondus?',
        a: "CaptureAI captures from your screen, not the browser's internal state, so it works alongside Respondus Monitor. Privacy Guard (Pro) goes further — it prevents the exam page from detecting tab switches, focus loss, and extension activity. Respondus LockDown Browser blocks all extensions by design and is not supported.",
    },
    {
        q: "Why isn't CaptureAI working on my school's LMS?",
        a: "First check that the extension is enabled at chrome://extensions. Some school LMS pages use strict Content Security Policies — try pressing Ctrl+Shift+E to force the UI to appear. If the site runs inside an iframe (common on Blackboard and Canvas), the extension may not inject into nested frames. On exam platforms, enable Privacy Guard (Pro) to prevent the site from blocking extension activity.",
    },
];

function QaList({ items }: { items: QaItem[] }) {
    return (
        <div className="space-y-6">
            {items.map((item, i) => (
                <div key={i} className={i > 0 ? 'border-t border-white/[0.04] pt-6' : ''}>
                    <h3 className="mb-2 text-sm font-medium text-[--color-text]">{item.q}</h3>
                    <p className="text-sm text-[--color-text-tertiary]">{item.a}</p>
                </div>
            ))}
        </div>
    );
}

export default function HelpPage() {
    const allItems = [...FAQ_ITEMS, ...TROUBLESHOOTING_ITEMS]
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allItems
        .filter((item) => typeof item.a === 'string')
        .map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a as string,
          },
        })),
    }

    return (
        <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="relative overflow-x-hidden py-20 md:py-28">
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
                    <p className="text-[--color-text-secondary]">
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
                            { keys: 'Ctrl + Shift + F', action: 'Quick capture last area' },
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
                    <QaList items={FAQ_ITEMS} />
                </section>

                {/* Troubleshooting */}
                <section className="glass-card mb-8 rounded-2xl p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/15 to-orange-500/10">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-[--color-text]">Troubleshooting</h2>

                    </div>
                    <QaList items={TROUBLESHOOTING_ITEMS} />
                </section>

                {/* Contact CTA */}
                <section className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10">
                            <MessageSquare className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="mb-2 text-[--color-text]">Still need help?</h3>
                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
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
        </>
    )
}

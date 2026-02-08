import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact - CaptureAI',
    description: 'Get in touch with the CaptureAI team for support or feature requests.',
}

export default function ContactPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="mb-3 text-[--color-text]">Contact</h1>
                    <p className="text-[--color-text-secondary]">
                        Questions, bugs, or feature ideas — we read everything.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Email Support */}
                    <div className="rounded-xl border border-[--color-border] p-6">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-surface]">
                            <Mail className="h-5 w-5 text-[--color-text-tertiary]" />
                        </div>
                        <h2 className="mb-1.5 text-base font-semibold text-[--color-text]">Support</h2>
                        <p className="mb-5 text-sm text-[--color-text-tertiary]">
                            Bug reports, account issues, or general questions. We respond within 24 hours.
                        </p>
                        <a
                            href="mailto:support@captureai.dev"
                            className="inline-flex rounded-lg bg-[--color-accent] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                        >
                            support@captureai.dev
                        </a>
                    </div>

                    {/* Feature Requests */}
                    <div className="rounded-xl border border-[--color-border] p-6">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[--color-surface]">
                            <MessageCircle className="h-5 w-5 text-[--color-text-tertiary]" />
                        </div>
                        <h2 className="mb-1.5 text-base font-semibold text-[--color-text]">Feedback</h2>
                        <p className="mb-5 text-sm text-[--color-text-tertiary]">
                            Feature requests, suggestions, or ideas for improvement.
                        </p>
                        <a
                            href="mailto:feedback@captureai.dev"
                            className="inline-flex rounded-lg border border-[--color-border] px-4 py-2 text-sm font-medium text-[--color-text-secondary] transition-colors hover:border-[--color-text-tertiary] hover:text-[--color-text]"
                        >
                            feedback@captureai.dev
                        </a>
                    </div>
                </div>

                {/* Help link */}
                <div className="mt-10 rounded-xl border border-[--color-border-subtle] p-6 text-center">
                    <h3 className="mb-2 text-[--color-text]">Looking for answers first?</h3>
                    <p className="mb-5 text-sm text-[--color-text-tertiary]">
                        Check the help center for guides and frequently asked questions.
                    </p>
                    <a
                        href="/help"
                        className="inline-flex rounded-lg border border-[--color-border] px-5 py-2.5 text-sm font-medium text-[--color-text-secondary] transition-colors hover:border-[--color-text-tertiary] hover:text-[--color-text]"
                    >
                        Help Center
                    </a>
                </div>
            </div>
        </div>
    )
}

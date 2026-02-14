import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, ArrowRight, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact',
    description: 'Get in touch with the CaptureAI team for support or feature requests.',
}

export default function ContactPage() {
    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-[-50px] top-[30%] h-[350px] w-[350px] rounded-full bg-cyan-500 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-3xl px-6">
                {/* Header */}
                <div className="mb-14 text-center">
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        Get in touch
                    </span>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Contact </span>
                        <span className="text-gradient-static">us</span>
                    </h1>
                    <p className="text-[--color-text-secondary]">
                        Questions, bugs, or feature ideas — we read everything.
                    </p>
                </div>

                {/* Contact cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2">
                    {/* Email Support */}
                    <div className="glass-card rounded-2xl p-7">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10">
                            <Mail className="h-6 w-6 text-blue-400" />
                        </div>
                        <h2 className="mb-1.5 text-lg font-semibold text-[--color-text]">Support</h2>
                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
                            Bug reports, account issues, or general questions. We respond within 24 hours.
                        </p>
                        <a
                            href="mailto:support@captureai.dev"
                            className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            <Mail className="h-4 w-4" />
                            support@captureai.dev
                        </a>
                    </div>

                    {/* Feature Requests */}
                    <div className="glass-card rounded-2xl p-7">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10">
                            <MessageCircle className="h-6 w-6 text-violet-400" />
                        </div>
                        <h2 className="mb-1.5 text-lg font-semibold text-[--color-text]">Feedback</h2>
                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
                            Feature requests, suggestions, or ideas for improvement.
                        </p>
                        <a
                            href="mailto:feedback@captureai.dev"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-[--color-text-secondary] transition-all hover:border-white/[0.15] hover:text-[--color-text]"
                        >
                            <MessageCircle className="h-4 w-4" />
                            feedback@captureai.dev
                        </a>
                    </div>
                </div>

                {/* Help link */}
                <div className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10">
                            <BookOpen className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="mb-2 text-[--color-text]">Looking for answers first?</h3>
                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
                            Check the help center for guides and frequently asked questions.
                        </p>
                        <Link
                            href="/help"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-[--color-text-secondary] transition-all hover:border-white/[0.15] hover:text-[--color-text]"
                        >
                            Help Center
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

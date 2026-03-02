import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy Policy for the CaptureAI Chrome extension. Learn how we handle your data.',
}

export default function PrivacyPage() {
    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-[-100px] top-[15%] h-[400px] w-[400px] rounded-full bg-blue-600 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-2xl px-6">
                {/* Header */}
                <div className="mb-14 text-center">
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        Legal
                    </span>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Privacy </span>
                        <span className="text-gradient-static">Policy</span>
                    </h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: March 1, 2026</p>
                </div>

                {/* Overview */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-3 text-base font-semibold text-[--color-text]">Overview</h2>
                    <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                        CaptureAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                        This Privacy Policy explains how we handle your information when you use the CaptureAI Chrome extension
                        and associated website. We collect only what&apos;s necessary to provide the service and never sell your data.
                    </p>
                </section>

                {/* Information We Collect */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">Information We Collect</h2>

                    <div className="space-y-6 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Account Information</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Email address (for license key delivery and account management)</li>
                                <li>License key and subscription tier (Free or Pro)</li>
                                <li>Payment information — processed securely through Stripe; we never store credit card details</li>
                            </ul>
                        </div>

                        <div className="divider-gradient" />

                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Usage Data</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Number of API requests (to enforce daily and rate limits by tier)</li>
                                <li>Request timestamps (for rate limiting purposes only)</li>
                            </ul>
                        </div>

                        <div className="divider-gradient" />

                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Screenshots and Queries</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Screenshots are processed <strong className="text-[--color-text-secondary]">locally in your browser</strong> using OCR to extract text</li>
                                <li>Extracted text (not the raw image when OCR is confident) is sent to our backend and forwarded to OpenAI for AI processing</li>
                                <li>We do <strong className="text-[--color-text-secondary]">not</strong> store your screenshots or queries on our servers</li>
                                <li>OpenAI processes data per their own privacy policy</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* How We Use Your Information */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-4 text-base font-semibold text-[--color-text]">How We Use Your Information</h2>
                    <ul className="ml-4 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <li>To provide and maintain the CaptureAI service</li>
                        <li>To deliver your license key via email</li>
                        <li>To process payments through Stripe</li>
                        <li>To enforce usage limits based on your subscription tier</li>
                        <li>To provide customer support</li>
                        <li>To send essential service updates (e.g. billing, policy changes)</li>
                    </ul>
                    <p className="mt-4 text-sm text-[--color-text-tertiary]">
                        We do not use your data for advertising, profiling, or sell it to any third party.
                    </p>
                </section>

                {/* Data Storage */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-4 text-base font-semibold text-[--color-text]">Data Storage</h2>
                    <div className="space-y-4 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">Extension storage:</span>{' '}
                            Your license key and settings are stored locally in Chrome&apos;s secure storage API. This data stays on your device.
                        </p>
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">Backend storage:</span>{' '}
                            License keys, email addresses, subscription tier, and usage counts are stored on our Cloudflare Workers backend using Cloudflare D1 (SQLite).
                        </p>
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">No screenshot storage:</span>{' '}
                            Screenshots are never stored on our servers. Text extraction happens locally in your browser before anything is sent to our API.
                        </p>
                    </div>
                </section>

                {/* Third-Party Services */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">Third-Party Services</h2>
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">OpenAI</h3>
                            <p>
                                Extracted text from your screenshots is sent to OpenAI via Cloudflare AI Gateway for AI processing.
                                Review <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">OpenAI&apos;s Privacy Policy</a>.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">Stripe</h3>
                            <p>
                                Payment processing for Pro subscriptions is handled entirely by Stripe. We do not store card details.
                                Review <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">Stripe&apos;s Privacy Policy</a>.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">Cloudflare</h3>
                            <p>
                                Our backend runs on Cloudflare Workers with Cloudflare D1 for data storage and Cloudflare AI Gateway for proxying AI requests.
                                Review <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">Cloudflare&apos;s Privacy Policy</a>.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">Resend</h3>
                            <p>
                                Transactional emails (license key delivery, receipts) are sent via Resend. Your email address is shared with Resend solely for this purpose.
                                Review <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">Resend&apos;s Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Rights & Retention */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">Your Rights & Data Retention</h2>
                    <div className="space-y-4 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <p>You have the right to:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Access the personal data we hold about you</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and associated data</li>
                            <li>Opt out of non-essential communications</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                        <div className="divider-gradient" />
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">Retention:</span>{' '}
                            Account and license data is retained as long as your account is active. Usage data is retained only as long as needed for rate limiting. You may request full deletion at any time by contacting us.
                        </p>
                    </div>
                </section>

                {/* Security */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-4 text-base font-semibold text-[--color-text]">Security</h2>
                    <ul className="ml-4 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <li>All data in transit is encrypted via HTTPS/TLS</li>
                        <li>Backend data is stored in Cloudflare&apos;s secure infrastructure</li>
                        <li>Stripe webhook signatures are verified with HMAC SHA-256 on every request</li>
                        <li>Sensitive data such as credit card details are never stored — handled entirely by Stripe</li>
                        <li>Extension data uses Chrome&apos;s secure <code className="rounded bg-white/[0.05] px-1 py-0.5 font-mono text-xs">chrome.storage</code> API</li>
                    </ul>
                </section>

                {/* Misc */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">Children&apos;s Privacy</h3>
                            <p>CaptureAI is not directed at users under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with data, contact us and we will delete it promptly.</p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-1.5 font-medium text-[--color-text-secondary]">Changes to This Policy</h3>
                            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the extension. Continued use of the service after changes constitutes acceptance.</p>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8">
                        <h2 className="mb-2 text-base font-semibold text-[--color-text]">Contact Us</h2>
                        <p className="mb-5 text-sm text-[--color-text-tertiary]">
                            Questions about this Privacy Policy? Reach out and we&apos;ll get back to you within 24 hours.
                        </p>
                        <div className="space-y-2 text-sm text-[--color-text-tertiary]">
                            <p>
                                <span className="font-medium text-[--color-text-secondary]">Email: </span>
                                <a href="mailto:support@captureai.dev" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">support@captureai.dev</a>
                            </p>
                            <p>
                                <span className="font-medium text-[--color-text-secondary]">Contact form: </span>
                                <Link href="/contact" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">captureai.dev/contact</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

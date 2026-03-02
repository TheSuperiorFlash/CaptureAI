import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service for the CaptureAI Chrome extension.',
}

export default function TermsPage() {
    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute right-[-100px] top-[15%] h-[400px] w-[400px] rounded-full bg-blue-600 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-2xl px-6">
                {/* Header */}
                <div className="mb-14 text-center">
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                        Legal
                    </span>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Terms of </span>
                        <span className="text-gradient-static">Service</span>
                    </h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: March 1, 2026</p>
                </div>

                {/* Acceptance */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-3 text-base font-semibold text-[--color-text]">Acceptance of Terms</h2>
                    <p className="text-sm leading-relaxed text-[--color-text-tertiary]">
                        By installing and using the CaptureAI Chrome extension (&quot;Service&quot;), you agree to be bound by
                        these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Service.
                        These Terms apply to all users of the Service, including Free and Pro subscribers.
                    </p>
                </section>

                {/* Description of Service */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-4 text-base font-semibold text-[--color-text]">Description of Service</h2>
                    <p className="mb-4 text-sm leading-relaxed text-[--color-text-tertiary]">
                        CaptureAI is a Chrome extension that uses AI to help users understand and answer questions from screenshots. The Service includes:
                    </p>
                    <ul className="ml-4 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <li>On-device OCR text extraction (performed locally in your browser via Tesseract.js)</li>
                        <li>AI-powered question answering powered by OpenAI models via Cloudflare AI Gateway</li>
                        <li>Privacy Guard — prevents focus detection and AI honeypot interference (Pro only)</li>
                        <li>Ask Mode — custom question prompting (Pro only)</li>
                        <li>Auto-Solve Mode — automated question solving on supported platforms (Pro only)</li>
                        <li>Free tier: 10 AI requests per day</li>
                        <li>Pro tier: Unlimited requests at $9.99/month</li>
                    </ul>
                </section>

                {/* License & Account */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">License Key & Account</h2>
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">License Grant</h3>
                            <p>
                                Upon activation, you receive a personal, non-transferable license key that grants access to the Service
                                according to your chosen tier. The license key is tied to your email address.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Account Responsibilities</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>You are responsible for keeping your license key confidential</li>
                                <li>You may not share, sell, or transfer your license key to others</li>
                                <li>You are responsible for all activity under your license key</li>
                                <li>You must provide accurate email information during activation</li>
                                <li>Contact us immediately if you suspect unauthorized use of your key</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Usage Limits */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">Usage Limits & Tiers</h2>
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Free Tier</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>10 AI requests per day, reset at midnight UTC</li>
                                <li>Access to core capture and question-answering features</li>
                                <li>Standard AI model (fastest response)</li>
                            </ul>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Pro Tier — $9.99/month</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Unlimited AI requests (subject to fair-use rate limiting)</li>
                                <li>All features: Privacy Guard, Ask Mode, Auto-Solve, and enhanced AI models</li>
                                <li>Priority email support</li>
                                <li>Early access to new features</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Payment Terms */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-6 text-base font-semibold text-[--color-text]">Payment Terms (Pro Tier)</h2>
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Billing</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Pro subscriptions are billed monthly at $9.99/month</li>
                                <li>Payment is processed securely by Stripe</li>
                                <li>Subscriptions renew automatically unless cancelled before the renewal date</li>
                                <li>A receipt is sent via email for each payment</li>
                            </ul>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Cancellation</h3>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Cancel anytime through your Stripe customer portal or by contacting support</li>
                                <li>Pro access continues until the end of the current billing period</li>
                                <li>After expiry, your account reverts to the Free tier automatically</li>
                            </ul>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Refund Policy</h3>
                            <p>
                                Refunds are considered on a case-by-case basis. Contact{' '}
                                <a href="mailto:support@captureai.dev" className="text-cyan-400 underline underline-offset-2 transition-colors hover:text-cyan-300">support@captureai.dev</a>{' '}
                                within 7 days of a charge if you believe a refund is warranted.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Acceptable Use */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <h2 className="mb-4 text-base font-semibold text-[--color-text]">Acceptable Use</h2>
                    <p className="mb-4 text-sm leading-relaxed text-[--color-text-tertiary]">You agree NOT to use the Service to:</p>
                    <ul className="ml-4 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <li>Violate any applicable laws or regulations</li>
                        <li>Infringe on intellectual property rights of third parties</li>
                        <li>Circumvent or abuse rate limits or usage quotas</li>
                        <li>Share, sell, or distribute your license key</li>
                        <li>Use the Service for automated bulk processing or resale</li>
                        <li>Attempt to reverse engineer, decompile, or extract source code</li>
                        <li>Interfere with or disrupt the Service or its infrastructure</li>
                        <li>Violate the terms of service of any platform you use the extension on</li>
                    </ul>
                    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm text-[--color-text-tertiary]">
                        <span className="font-medium text-[--color-text-secondary]">Academic Integrity: </span>
                        CaptureAI is intended as a learning aid. You are solely responsible for ensuring your use complies with your institution&apos;s academic integrity policies. We do not condone cheating on assessments where AI assistance is prohibited.
                    </div>
                </section>

                {/* Intellectual Property & Disclaimers */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Intellectual Property</h3>
                            <p className="mb-3">
                                CaptureAI, including all code, design, and branding, is owned by Grayson Kramer.
                                You retain ownership of your screenshots and queries. By using the Service, you grant us permission
                                to process your content solely to provide the Service.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Disclaimers</h3>
                            <p>
                                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee the accuracy
                                of AI-generated answers. AI models can make mistakes — the Service is a study aid, not a definitive source of truth.
                                OCR text extraction may not perfectly capture all on-screen content.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Limitation of Liability</h3>
                            <p>
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                                INCURRED DIRECTLY OR INDIRECTLY, RESULTING FROM YOUR USE OF THE SERVICE.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Service & Termination */}
                <section className="glass-card mb-6 rounded-2xl p-8">
                    <div className="space-y-5 text-sm leading-relaxed text-[--color-text-tertiary]">
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Service Availability</h3>
                            <p>
                                We strive for high availability but do not guarantee uninterrupted service. We may suspend or modify
                                the Service for maintenance, security, or operational reasons at any time without notice.
                            </p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Termination</h3>
                            <p className="mb-3">We reserve the right to suspend or terminate your access for:</p>
                            <ul className="ml-4 list-inside list-disc space-y-1.5">
                                <li>Violation of these Terms</li>
                                <li>Fraudulent or illegal activity</li>
                                <li>Abuse of the Service or infrastructure</li>
                                <li>Non-payment of Pro subscription fees</li>
                            </ul>
                            <p className="mt-3">You may terminate your account at any time by cancelling your subscription and contacting us to delete your data.</p>
                        </div>
                        <div className="divider-gradient" />
                        <div>
                            <h3 className="mb-2 font-medium text-[--color-text-secondary]">Changes to Terms</h3>
                            <p>
                                We may modify these Terms at any time. We will notify you of material changes via email.
                                Continued use of the Service after changes constitutes acceptance of the updated Terms.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8">
                        <h2 className="mb-2 text-base font-semibold text-[--color-text]">Questions?</h2>
                        <p className="mb-5 text-sm text-[--color-text-tertiary]">
                            If you have questions about these Terms, reach out and we&apos;ll respond within 24 hours.
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

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy Policy for the CaptureAI Chrome extension. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                <div className="mb-12">
                    <h1 className="mb-2 text-[--color-text]">Privacy Policy</h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: March 1, 2026</p>
                </div>

                <div className="space-y-10 text-sm leading-relaxed text-[--color-text-tertiary]">

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">1. Introduction</h2>
                        <p>
                            CaptureAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, store, and protect your information when you use the CaptureAI
                            Chrome extension and associated website (collectively, the &quot;Service&quot;). By using the Service, you agree
                            to the collection and use of information in accordance with this policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">2. Information We Collect</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Account Information</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Email address — used for license key delivery and account management</li>
                            <li>License key and subscription tier (Free or Pro)</li>
                            <li>Payment information — processed securely by Stripe; we never store credit card details</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Screenshots and Queries</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Screenshots are processed <strong className="text-[--color-text-secondary]">locally in your browser</strong> using on-device OCR (Tesseract.js) to extract text</li>
                            <li>When OCR confidence is sufficient, only the extracted text (not the image) is sent to our backend for AI processing — this saves significant data and improves privacy</li>
                            <li>If OCR confidence is low, the image may be sent for more accurate processing</li>
                            <li>We do <strong className="text-[--color-text-secondary]">not</strong> store your screenshots or queries on our servers beyond the duration of the request</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Usage Data</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Number of API requests made (to enforce daily limits and rate limiting by tier)</li>
                            <li>Request timestamps (for rate limiting purposes only)</li>
                            <li>This data is not linked to any personally identifiable information beyond your license key</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">3. How We Use Your Information</h2>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>To provide and operate the CaptureAI Service</li>
                            <li>To deliver your license key via email upon activation</li>
                            <li>To process payments and manage your subscription through Stripe</li>
                            <li>To enforce usage limits and rate limits based on your subscription tier</li>
                            <li>To provide customer support and respond to inquiries</li>
                            <li>To send essential service communications (e.g. billing receipts, policy updates)</li>
                            <li>To improve the performance and reliability of the Service</li>
                        </ul>
                        <p className="mt-3">
                            We do not use your data for advertising, behavioral profiling, or sell it to any third party.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">4. Data Sharing and Disclosure</h2>
                        <p className="mb-3">
                            We do not sell or trade your personally identifiable information. We may share your information only in the following circumstances:
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Service Providers</h3>
                        <p className="mb-3">We work with the following third-party providers to deliver the Service:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li><strong className="text-[--color-text-secondary]">OpenAI</strong> — AI processing of extracted text via Cloudflare AI Gateway. Review <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">OpenAI&apos;s Privacy Policy</a>.</li>
                            <li><strong className="text-[--color-text-secondary]">Cloudflare</strong> — Backend infrastructure (Workers, D1 database, AI Gateway). Review <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">Cloudflare&apos;s Privacy Policy</a>.</li>
                            <li><strong className="text-[--color-text-secondary]">Stripe</strong> — Payment processing for Pro subscriptions. Review <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">Stripe&apos;s Privacy Policy</a>.</li>
                            <li><strong className="text-[--color-text-secondary]">Resend</strong> — Transactional email delivery (license keys, receipts). Review <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">Resend&apos;s Privacy Policy</a>.</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Legal Compliance</h3>
                        <p>
                            We may disclose your information if required by law, legal process, or to protect our rights and the safety of our users.
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Business Transfers</h3>
                        <p>
                            If CaptureAI or its assets are acquired or merged, user data may be transferred as part of that transaction. You will be notified of any such change.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">5. Data Storage and Retention</h2>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Extension storage:</span>{' '}
                            Your license key and settings are stored locally in Chrome&apos;s secure <code className="rounded bg-white/[0.05] px-1 font-mono">chrome.storage</code> API on your device only.
                        </p>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Backend storage:</span>{' '}
                            License keys, email addresses, subscription tier, and usage counts are stored on Cloudflare D1. This data is retained for as long as your account is active.
                        </p>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Screenshot and query data:</span>{' '}
                            Not stored. Text extracted from your screenshots is processed transiently and discarded immediately after the AI response is returned.
                        </p>
                        <p>
                            You may request full deletion of your account and associated data at any time by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">6. Security</h2>
                        <p className="mb-3">
                            We implement industry-standard security measures to protect your information:
                        </p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>All data in transit is encrypted via HTTPS/TLS</li>
                            <li>Backend data is stored within Cloudflare&apos;s secure infrastructure</li>
                            <li>Stripe webhook signatures are verified using HMAC SHA-256 on every incoming request</li>
                            <li>Sensitive data such as payment details are never stored — handled entirely by Stripe</li>
                            <li>Extension data is isolated within Chrome&apos;s secure storage API</li>
                        </ul>
                        <p className="mt-3">
                            No online system is 100% secure. While we take reasonable precautions, we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">7. Your Rights and Choices</h2>
                        <p className="mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li><span className="font-medium text-[--color-text-secondary]">Access:</span> Request a copy of the personal data we hold about you</li>
                            <li><span className="font-medium text-[--color-text-secondary]">Correction:</span> Request correction of inaccurate or incomplete data</li>
                            <li><span className="font-medium text-[--color-text-secondary]">Deletion:</span> Request deletion of your account and personal data</li>
                            <li><span className="font-medium text-[--color-text-secondary]">Objection:</span> Object to or restrict certain types of data processing</li>
                            <li><span className="font-medium text-[--color-text-secondary]">Portability:</span> Receive your data in a portable, structured format</li>
                            <li><span className="font-medium text-[--color-text-secondary]">Withdraw consent:</span> Opt out of non-essential communications at any time</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, contact us at <a href="mailto:support@captureai.dev" className="text-[--color-accent-hover] underline underline-offset-2">support@captureai.dev</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">8. International Data Transfers</h2>
                        <p>
                            CaptureAI&apos;s backend infrastructure runs on Cloudflare&apos;s global network. If you are located outside the United States, your data may be transferred to and processed in countries with different data protection laws. By using the Service, you consent to this transfer. We ensure that appropriate safeguards are in place through our use of reputable service providers who comply with applicable data protection regulations.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">9. Children&apos;s Privacy</h2>
                        <p>
                            CaptureAI is not directed at users under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal data, we will delete it promptly. If you believe a child has submitted data to us, contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">10. Third-Party Links</h2>
                        <p>
                            The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies before providing any personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">11. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. We will notify you of material changes via email or through the extension. Continued use of the Service after changes constitutes acceptance of the revised policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">12. Contact Us</h2>
                        <p className="mb-3">
                            If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us:
                        </p>
                        <ul className="space-y-1.5">
                            <li><span className="font-medium text-[--color-text-secondary]">Email:</span>{' '}<a href="mailto:support@captureai.dev" className="text-[--color-accent-hover] underline underline-offset-2">support@captureai.dev</a></li>
                            <li><span className="font-medium text-[--color-text-secondary]">Contact form:</span>{' '}<Link href="/contact" className="text-[--color-accent-hover] underline underline-offset-2">captureai.dev/contact</Link></li>
                        </ul>
                    </section>

                </div>
            </div>
        </div>
    )
}

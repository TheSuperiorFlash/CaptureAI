import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service for the CaptureAI Chrome extension.',
    alternates: {
        canonical: '/terms',
    },
}

export default function TermsPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                <div className="mb-12">
                    <h1 className="mb-2 text-[--color-text]">Terms of Service</h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: March 1, 2026</p>
                </div>

                <div className="space-y-10 text-sm leading-relaxed text-[--color-text-tertiary]">

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">1. Introduction</h2>
                        <p>
                            These Terms of Service (&quot;Terms&quot;) govern your use of the CaptureAI Chrome extension and associated website
                            (collectively, the &quot;Service&quot;) provided by Grayson Kramer (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
                            By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">2. Eligibility</h2>
                        <p>
                            You must be at least 13 years old to use the Service. If you are under 18, you must have permission from a
                            parent or legal guardian. By using the Service, you represent that you meet these requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">3. Description of Service</h2>
                        <p className="mb-3">
                            CaptureAI is a Chrome extension that uses AI to help users understand and answer questions from screenshots. The Service includes:
                        </p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>On-device OCR text extraction via Tesseract.js (performed locally in your browser)</li>
                            <li>AI-powered question answering using OpenAI models via Cloudflare AI Gateway</li>
                            <li>Privacy Guard — prevents focus/visibility detection on supported sites (Pro only)</li>
                            <li>Ask Mode — custom question prompting (Pro only)</li>
                            <li>Auto-Solve Mode — automated question solving on supported platforms (Pro only)</li>
                            <li>Basic tier: 50 AI requests per day at $1.49/week</li>
                            <li>Pro tier: Unlimited requests at $9.99/month</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">4. Account Registration and License Key</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Activation</h3>
                        <p className="mb-3">
                            To use the Service, you must activate a license key using a valid email address. The license key is personal and
                            non-transferable. You are responsible for all activity that occurs under your license key.
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Account Responsibilities</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Keep your license key confidential — do not share it with others</li>
                            <li>Provide accurate email information during activation</li>
                            <li>Contact us immediately if you suspect unauthorized use of your key</li>
                            <li>You may not sell, transfer, or sublicense your license key</li>
                        </ul>

                        <p className="mt-3">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">5. Use of Services</h2>
                        <p className="mb-3">You agree to use the Service lawfully and not for any fraudulent or harmful purposes. You agree NOT to:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on the intellectual property rights of third parties</li>
                            <li>Circumvent, abuse, or attempt to bypass usage limits or rate limiting</li>
                            <li>Share, sell, or distribute your license key to others</li>
                            <li>Use the Service for automated bulk processing, resale, or commercial redistribution</li>
                            <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
                            <li>Interfere with or disrupt the Service, its servers, or its infrastructure</li>
                            <li>Violate the terms of service of any platform you use the extension on</li>
                        </ul>

                        <p className="mt-4">
                            <span className="font-medium text-[--color-text-secondary]">Academic Integrity:</span>{' '}
                            CaptureAI is intended as a learning aid. You are solely responsible for ensuring your use complies with your
                            institution&apos;s academic integrity policies. We do not condone cheating on assessments where AI assistance is prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">6. Payments and Subscriptions</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Billing</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Pro subscriptions are billed monthly at $9.99/month</li>
                            <li>By subscribing, you authorize us to charge your payment method on a recurring monthly basis until cancelled</li>
                            <li>Payment is processed securely by Stripe — we do not store credit card details</li>
                            <li>A receipt is sent via email for each successful payment</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Cancellation</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>You may cancel your subscription at any time through your Stripe customer portal or by contacting support</li>
                            <li>Cancellations must be made before the next billing cycle to avoid further charges</li>
                            <li>Pro access continues until the end of the current billing period, after which the account reverts to Free</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Refund Policy</h3>
                        <p>
                            We do not offer automatic refunds. Refunds may be granted at our discretion in specific circumstances.
                            For refund inquiries, contact us at{' '}
                            <a href="mailto:support@captureai.dev" className="text-[--color-accent-hover] underline underline-offset-2">support@captureai.dev</a>{' '}
                            within 7 days of a charge.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">7. Intellectual Property</h2>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Our property:</span>{' '}
                            All content, trademarks, code, and branding within the Service are owned by Grayson Kramer or licensed for use.
                            You may not copy, modify, distribute, or exploit any part of the Service without written permission.
                        </p>
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">Your content:</span>{' '}
                            You retain ownership of your screenshots and queries. By using the Service, you grant us a limited,
                            non-exclusive license to process your content solely to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">8. Service Availability</h2>
                        <p>
                            We strive for high availability but do not guarantee uninterrupted or error-free operation of the Service.
                            We reserve the right to modify, suspend, or discontinue any feature or the Service entirely at any time,
                            with or without notice. We are not liable for any downtime, data loss, or service interruptions.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">9. Disclaimers</h2>
                        <p>
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                            We do not warrant that the Service will meet your requirements, be uninterrupted, or be free of errors.
                            We do not guarantee the accuracy of AI-generated answers — the Service is a study aid, not a definitive
                            source of information. Text extraction may not perfectly capture all on-screen content.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">10. Limitation of Liability</h2>
                        <p className="mb-3">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                            INCURRED DIRECTLY OR INDIRECTLY, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
                        </p>
                        <p>
                            In no event shall our total liability to you exceed the amount you have paid us for the Service in the
                            six months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">11. Indemnification</h2>
                        <p>
                            You agree to indemnify and hold harmless CaptureAI and Grayson Kramer from any claims, damages, losses,
                            or expenses (including legal fees) arising from your use of the Service, your violation of these Terms,
                            or your infringement of any third-party rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">12. Termination</h2>
                        <p className="mb-3">We reserve the right to suspend or terminate your access to the Service for:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Violation of these Terms</li>
                            <li>Fraudulent, illegal, or abusive activity</li>
                            <li>Abuse of the Service or its infrastructure</li>
                            <li>Non-payment of Pro subscription fees</li>
                        </ul>
                        <p className="mt-3">
                            Termination may occur without prior notice if fraudulent or abusive behavior is detected.
                            You may terminate your account at any time by cancelling your subscription and contacting us to delete your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">13. Privacy Policy</h2>
                        <p>
                            Your use of the Service is also governed by our{' '}
                            <Link href="/privacy" className="text-[--color-accent-hover] underline underline-offset-2">Privacy Policy</Link>,
                            which is incorporated into these Terms by reference. By using the Service, you agree to both these Terms and our Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">14. Changes to Terms</h2>
                        <p>
                            We may update these Terms at any time. Changes will be posted on this page with an updated &quot;Last updated&quot; date.
                            We will notify you of material changes via email. Continued use of the Service after changes constitutes
                            acceptance of the updated Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">15. Contact</h2>
                        <p className="mb-3">For questions about these Terms, please contact us:</p>
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

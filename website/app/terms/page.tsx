export default function TermsPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                <div className="mb-12">
                    <h1 className="mb-2 text-[--color-text]">Terms of Service</h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: December 22, 2024</p>
                </div>

                <div className="space-y-10 text-sm leading-relaxed text-[--color-text-tertiary]">
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Acceptance of Terms</h2>
                        <p>
                            By installing and using the CaptureAI Chrome extension (&quot;Service&quot;), you agree to be bound by
                            these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Description of Service</h2>
                        <p className="mb-3">
                            CaptureAI is a Chrome extension that uses OCR and AI to help users solve questions from screenshots. The Service includes:
                        </p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Question capture and OCR text extraction (performed locally in your browser)</li>
                            <li>AI-powered question answering using OpenAI&apos;s API</li>
                            <li>Free tier: 10 requests per day</li>
                            <li>Pro tier: Unlimited requests for $9.99/month</li>
                            <li>Auto-solve feature for Vocabulary.com</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">License Key and Account</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">License Grant</h3>
                        <p className="mb-3">
                            Upon creating an account, you will receive a license key that grants you access to the Service
                            according to your chosen tier (Free or Pro).
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Account Responsibilities</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>You are responsible for maintaining the confidentiality of your license key</li>
                            <li>You may not share your license key with others</li>
                            <li>You are responsible for all activities that occur under your license key</li>
                            <li>You must provide accurate email information for account creation</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Usage Limits and Tiers</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Free Tier</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>10 AI requests per day</li>
                            <li>Access to core features</li>
                            <li>Subject to rate limiting</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Pro Tier</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Unlimited AI requests</li>
                            <li>$9.99 per month, billed monthly</li>
                            <li>All features including Privacy Guard, Ask Mode, and Auto-Solve</li>
                            <li>Email support</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Payment Terms (Pro Tier)</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Billing</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Pro subscriptions are billed monthly at $9.99/month</li>
                            <li>Payment is processed securely through Stripe</li>
                            <li>Subscriptions automatically renew unless cancelled</li>
                            <li>You will receive a receipt via email for each payment</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Cancellation</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>You may cancel your Pro subscription at any time through your Stripe customer portal</li>
                            <li>Upon cancellation, you will retain Pro access until the end of your current billing period</li>
                            <li>After the billing period ends, your account will revert to the Free tier</li>
                            <li>No partial refunds for monthly subscriptions</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Refund Policy</h3>
                        <p>
                            We offer a 7-day money-back guarantee for first-time Pro subscribers. To request a refund,
                            contact us at <a href="mailto:wonhappyheart@gmail.com" className="text-[--color-accent-hover] underline underline-offset-2">wonhappyheart@gmail.com</a> within 7 days of your initial purchase.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Acceptable Use</h2>
                        <p className="mb-3">You agree NOT to use the Service to:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Engage in academic dishonesty or cheating where prohibited</li>
                            <li>Abuse or circumvent rate limits</li>
                            <li>Share or resell your license key</li>
                            <li>Use the Service for automated or high-volume commercial purposes</li>
                            <li>Reverse engineer or attempt to extract source code</li>
                            <li>Interfere with or disrupt the Service</li>
                        </ul>

                        <p className="mt-3">
                            <span className="font-medium text-[--color-text-secondary]">Academic Integrity:</span> CaptureAI is intended as a learning aid. You are responsible for ensuring your use complies with your institution&apos;s academic integrity policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Service Availability</h2>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>We strive to maintain high uptime but do not guarantee uninterrupted service</li>
                            <li>We may suspend or terminate the Service for maintenance or security reasons</li>
                            <li>We are not liable for service interruptions or data loss</li>
                            <li>We reserve the right to modify or discontinue features at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Intellectual Property</h2>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Service Ownership:</span> CaptureAI, including all code, design, and branding, is owned by Grayson Kramer. The Service is licensed under the MIT License for the open-source components.
                        </p>
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">Your Content:</span> You retain ownership of your screenshots and queries. By using the Service, you grant us permission to process your content to provide the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Disclaimers</h2>
                        <p className="mb-3">
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee the accuracy of AI-generated answers. The Service is intended as a study aid, not a definitive source of information. OCR technology may not perfectly extract text from all images.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                            INCURRED DIRECTLY OR INDIRECTLY, RESULTING FROM YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Termination</h2>
                        <p className="mb-3">We reserve the right to suspend or terminate your access for:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Violation of these Terms</li>
                            <li>Fraudulent or illegal activity</li>
                            <li>Abuse of the Service</li>
                            <li>Non-payment (Pro tier)</li>
                        </ul>
                        <p className="mt-3">
                            You may terminate your account at any time by contacting us or cancelling your subscription.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Changes to Terms</h2>
                        <p>
                            We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Contact</h2>
                        <p className="mb-3">For questions about these Terms:</p>
                        <ul className="space-y-1.5">
                            <li><span className="font-medium text-[--color-text-secondary]">Email:</span> <a href="mailto:wonhappyheart@gmail.com" className="text-[--color-accent-hover] underline underline-offset-2">wonhappyheart@gmail.com</a></li>
                            <li><span className="font-medium text-[--color-text-secondary]">GitHub:</span> <a href="https://github.com/TheSuperiorFlash/CaptureAI" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">TheSuperiorFlash/CaptureAI</a></li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    )
}

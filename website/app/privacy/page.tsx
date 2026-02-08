export default function PrivacyPage() {
    return (
        <div className="py-20 md:py-28">
            <div className="mx-auto max-w-2xl px-6">
                <div className="mb-12">
                    <h1 className="mb-2 text-[--color-text]">Privacy Policy</h1>
                    <p className="text-sm text-[--color-text-tertiary]">Last updated: December 22, 2024</p>
                </div>

                <div className="space-y-10 text-sm leading-relaxed text-[--color-text-tertiary]">
                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Overview</h2>
                        <p>
                            CaptureAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                            This Privacy Policy explains how we handle your information when you use the CaptureAI Chrome extension
                            and associated website.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Information We Collect</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">License Key Information</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Email address (for license key delivery and account management)</li>
                            <li>License key and tier (Free or Pro)</li>
                            <li>Payment information (processed securely through Stripe, we do not store credit card details)</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Usage Data</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Number of API requests (to enforce tier limits)</li>
                            <li>Request timestamps (for rate limiting)</li>
                        </ul>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Screenshots and Queries</h3>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Screenshots are processed using OCR locally in your browser</li>
                            <li>Extracted text is sent to OpenAI&apos;s API for processing</li>
                            <li>We do NOT store your screenshots or queries on our servers</li>
                            <li>OpenAI processes data according to their own privacy policy</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">How We Use Your Information</h2>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>To provide and maintain the CaptureAI service</li>
                            <li>To deliver your license key via email</li>
                            <li>To process payments through Stripe</li>
                            <li>To enforce usage limits based on your tier</li>
                            <li>To provide customer support</li>
                            <li>To send important service updates</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Data Storage</h2>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Extension Storage:</span> Your license key and settings are stored locally in Chrome&apos;s secure storage API. This data remains on your device.
                        </p>
                        <p className="mb-3">
                            <span className="font-medium text-[--color-text-secondary]">Backend Storage:</span> We store license keys, email addresses, tier information, and usage counts on our Cloudflare Workers backend with Cloudflare D1 database.
                        </p>
                        <p>
                            <span className="font-medium text-[--color-text-secondary]">No Screenshot Storage:</span> We do NOT store your screenshots or the questions you ask. OCR is performed locally in your browser using Tesseract.js.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Third-Party Services</h2>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">OpenAI</h3>
                        <p>
                            We send extracted text from your screenshots to OpenAI&apos;s API for AI processing.
                            Review <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">OpenAI&apos;s Privacy Policy</a>.
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Stripe</h3>
                        <p>
                            Payment processing for Pro subscriptions is handled by Stripe. We do not store your credit card information.
                            Review <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">Stripe&apos;s Privacy Policy</a>.
                        </p>

                        <h3 className="mb-2 mt-5 font-medium text-[--color-text-secondary]">Cloudflare</h3>
                        <p>
                            Our backend runs on Cloudflare Workers.
                            Review <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[--color-accent-hover] underline underline-offset-2">Cloudflare&apos;s Privacy Policy</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Data Retention</h2>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>License keys and account information are retained as long as your account is active</li>
                            <li>Usage data is retained for rate limiting purposes only</li>
                            <li>You may request deletion of your data by contacting us</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Your Rights</h2>
                        <p className="mb-3">You have the right to:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>Access your personal data</li>
                            <li>Request correction of your data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Unsubscribe from our emails (except essential service emails)</li>
                            <li>Export your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Security</h2>
                        <p className="mb-3">We implement appropriate security measures to protect your data:</p>
                        <ul className="ml-4 list-inside list-disc space-y-1.5">
                            <li>HTTPS encryption for all data transmission</li>
                            <li>Secure storage in Cloudflare&apos;s infrastructure</li>
                            <li>No storage of sensitive data like credit cards (handled by Stripe)</li>
                            <li>Chrome&apos;s secure storage API for extension data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Children&apos;s Privacy</h2>
                        <p>
                            CaptureAI is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the extension.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-lg font-semibold text-[--color-text]">Contact Us</h2>
                        <p className="mb-3">If you have any questions about this Privacy Policy:</p>
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

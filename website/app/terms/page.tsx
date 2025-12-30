export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08070e] py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: December 22, 2024</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By installing and using the CaptureAI Chrome extension (&quot;Service&quot;), you agree to be bound by
                these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Description of Service</h2>
              <p className="leading-relaxed mb-4">
                CaptureAI is a Chrome extension that uses Optical Character Recognition (OCR) and AI to help users
                solve questions from screenshots. The Service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Question capture and OCR text extraction (performed locally in your browser)</li>
                <li>AI-powered question answering using OpenAI&apos;s API</li>
                <li>Free tier: 10 requests per day</li>
                <li>Pro tier: Unlimited requests for $9.99/month</li>
                <li>Auto-solve feature for Vocabulary.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">License Key and Account</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">License Grant</h3>
              <p className="leading-relaxed mb-4">
                Upon creating an account, you will receive a license key that grants you access to the Service
                according to your chosen tier (Free or Pro).
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for maintaining the confidentiality of your license key</li>
                <li>You may not share your license key with others</li>
                <li>You are responsible for all activities that occur under your license key</li>
                <li>You must provide accurate email information for account creation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Usage Limits and Tiers</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Free Tier</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>10 AI requests per day</li>
                <li>Access to all core features</li>
                <li>Subject to rate limiting</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Pro Tier</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Unlimited AI requests</li>
                <li>$9.99 per month, billed monthly</li>
                <li>Priority processing</li>
                <li>Email support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Payment Terms (Pro Tier)</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Billing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pro subscriptions are billed monthly at $9.99/month</li>
                <li>Payment is processed securely through Stripe</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You will receive a receipt via email for each payment</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Cancellation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may cancel your Pro subscription at any time through your Stripe customer portal</li>
                <li>Upon cancellation, you will retain Pro access until the end of your current billing period</li>
                <li>After the billing period ends, your account will revert to the Free tier</li>
                <li>No partial refunds for monthly subscriptions</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Refund Policy</h3>
              <p className="leading-relaxed">
                We offer a 7-day money-back guarantee for first-time Pro subscribers. To request a refund,
                contact us at <a href="mailto:wonhappyheart@gmail.com"
                className="text-blue-400 hover:text-blue-300 underline">wonhappyheart@gmail.com</a> within
                7 days of your initial purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptable Use</h2>
              <p className="leading-relaxed mb-4">You agree NOT to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Engage in academic dishonesty or cheating where prohibited</li>
                <li>Abuse or circumvent rate limits</li>
                <li>Share or resell your license key</li>
                <li>Use the Service for automated or high-volume commercial purposes</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>

              <p className="leading-relaxed mt-4">
                <strong>Academic Integrity:</strong> CaptureAI is intended as a learning aid. You are responsible
                for ensuring your use of the Service complies with your institution&apos;s academic integrity policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We strive to maintain 99.9% uptime but do not guarantee uninterrupted service</li>
                <li>We may suspend or terminate the Service for maintenance or security reasons</li>
                <li>We are not liable for service interruptions or data loss</li>
                <li>We reserve the right to modify or discontinue features at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              <p className="leading-relaxed mb-4">
                <strong>Service Ownership:</strong> CaptureAI, including all code, design, and branding, is owned
                by Grayson Kramer. The Service is licensed under the MIT License for the open-source components.
              </p>
              <p className="leading-relaxed">
                <strong>Your Content:</strong> You retain ownership of your screenshots and queries. By using the
                Service, you grant us permission to process your content to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
              <p className="leading-relaxed mb-4">
                The Service uses third-party services, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>OpenAI:</strong> AI processing (subject to OpenAI&apos;s terms)</li>
                <li><strong>Stripe:</strong> Payment processing (subject to Stripe&apos;s terms)</li>
                <li><strong>Cloudflare:</strong> Backend infrastructure (subject to Cloudflare&apos;s terms)</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Your use of these services is subject to their respective terms of service and privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimers</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">No Warranty</h3>
              <p className="leading-relaxed mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Accuracy</h3>
              <p className="leading-relaxed mb-4">
                We do not guarantee the accuracy of AI-generated answers. The Service is intended as a study
                aid, not a definitive source of information.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">OCR Limitations</h3>
              <p className="leading-relaxed">
                OCR technology may not perfectly extract text from all images. Quality depends on screenshot
                clarity, font, and other factors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <p className="leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
                LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              <p className="leading-relaxed mb-4">
                We reserve the right to suspend or terminate your access to the Service at any time for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of the Service</li>
                <li>Non-payment (Pro tier)</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You may terminate your account at any time by contacting us or cancelling your subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
              <p className="leading-relaxed">
                We may modify these Terms at any time. We will notify users of significant changes via email
                or through the extension. Continued use of the Service after changes constitutes acceptance
                of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States,
                without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
              <p className="leading-relaxed">
                For questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> <a href="mailto:wonhappyheart@gmail.com"
                  className="text-blue-400 hover:text-blue-300 underline">wonhappyheart@gmail.com</a></li>
                <li><strong>GitHub:</strong> <a href="https://github.com/TheSuperiorFlash/CaptureAI"
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline">TheSuperiorFlash/CaptureAI</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

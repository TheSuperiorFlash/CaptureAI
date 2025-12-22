export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08070e] py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: December 22, 2024</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
              <p className="leading-relaxed">
                CaptureAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we handle your information when you use the CaptureAI Chrome extension
                and associated website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">License Key Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email address (for license key delivery and account management)</li>
                <li>License key and tier (Free or Pro)</li>
                <li>Payment information (processed securely through Stripe, we do not store credit card details)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Usage Data</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Number of API requests (to enforce tier limits)</li>
                <li>Request timestamps (for rate limiting)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Screenshots and Queries</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Screenshots are processed using OCR (Optical Character Recognition) locally in your browser</li>
                <li>Extracted text is sent to OpenAI&apos;s API for processing</li>
                <li>We do NOT store your screenshots or queries on our servers</li>
                <li>OpenAI processes data according to their own privacy policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain the CaptureAI service</li>
                <li>To deliver your license key via email</li>
                <li>To process payments through Stripe</li>
                <li>To enforce usage limits based on your tier</li>
                <li>To provide customer support</li>
                <li>To send important service updates (license key, payment confirmations)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Storage</h2>
              <p className="leading-relaxed mb-4">
                <strong>Extension Storage:</strong> Your license key and settings are stored locally in Chrome&apos;s
                secure storage API. This data remains on your device.
              </p>
              <p className="leading-relaxed mb-4">
                <strong>Backend Storage:</strong> We store license keys, email addresses, tier information, and
                usage counts on our Cloudflare Workers backend with Cloudflare D1 database.
              </p>
              <p className="leading-relaxed">
                <strong>No Screenshot Storage:</strong> We do NOT store your screenshots or the questions you ask.
                OCR is performed locally in your browser using Tesseract.js.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">OpenAI</h3>
              <p className="leading-relaxed mb-4">
                We send extracted text from your screenshots to OpenAI&apos;s API for AI processing.
                Please review <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline">OpenAI&apos;s Privacy Policy</a>.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Stripe</h3>
              <p className="leading-relaxed mb-4">
                Payment processing for Pro subscriptions is handled by Stripe. We do not store your credit card
                information. Please review <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline">Stripe&apos;s Privacy Policy</a>.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Cloudflare</h3>
              <p className="leading-relaxed">
                Our backend runs on Cloudflare Workers. Please review <a href="https://www.cloudflare.com/privacypolicy/"
                target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                Cloudflare&apos;s Privacy Policy</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>License keys and account information are retained as long as your account is active</li>
                <li>Usage data is retained for rate limiting purposes only</li>
                <li>You may request deletion of your data by contacting us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your account and data</li>
                <li>Unsubscribe from our emails (except essential service emails)</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Security</h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure storage in Cloudflare&apos;s infrastructure</li>
                <li>No storage of sensitive data like credit cards (handled by Stripe)</li>
                <li>Chrome&apos;s secure storage API for extension data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Children&apos;s Privacy</h2>
              <p className="leading-relaxed">
                CaptureAI is not intended for users under 13 years of age. We do not knowingly collect
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes
                via email or through the extension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us:
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

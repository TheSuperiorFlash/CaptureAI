import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Help - CaptureAI',
    description: 'Learn how to use CaptureAI effectively',
}

export default function DocsPage() {
    return (
        <div className="py-24 bg-[#08070e] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Help Center</h1>
                <p className="text-xl text-gray-300 mb-12">
                    Everything you need to know about using CaptureAI
                </p>

                {/* Getting Started */}
                <section className="mb-16 bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-white mb-6">Getting Started</h2>

                    <div className="prose prose-lg max-w-none">
                        <h3 className="text-2xl font-semibold text-white mb-4">Installation</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                            <li>Visit the Chrome Web Store and install CaptureAI</li>
                            <li>Click "Add to Chrome"</li>
                            <li>Get your license key from the activation page</li>
                            <li>Enter your license key in the extension to start using CaptureAI</li>
                        </ol>

                        <h3 className="text-2xl font-semibold text-white mb-4 mt-8">How to Use</h3>
                        <p className="text-gray-300 mb-4">
                            Using CaptureAI is simple:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                            <li>Click the floating CaptureAI button on any webpage</li>
                            <li>Take a screenshot of your question using the capture tool</li>
                            <li>Wait a moment while AI analyzes your question</li>
                            <li>Get your answer displayed right on the page</li>
                        </ol>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-16 bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-white mb-6">FAQ</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                How do I get a license key?
                            </h3>
                            <p className="text-gray-300">
                                Visit the activation page and enter your email. You'll receive a license key via email that you can use to activate the extension.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                What's the difference between Free and Pro?
                            </h3>
                            <p className="text-gray-300">
                                Free tier gives you 10 requests per day. Pro tier gives you unlimited requests for $9.99/month.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Which browser does CaptureAI support?
                            </h3>
                            <p className="text-gray-300">
                                CaptureAI is designed for Google Chrome and has been tested and validated to work reliably on Chrome.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                How do I upgrade to Pro?
                            </h3>
                            <p className="text-gray-300">
                                Visit the activation page and select the Pro tier. After payment, you'll receive a Pro license key via email.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Support */}
                <section className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Need Help?</h2>
                    <p className="text-gray-300 mb-4">
                        Can't find what you're looking for? We're here to help!
                    </p>
                    <a
                        href="/contact"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                    >
                        Contact Support
                    </a>
                </section>
            </div>
        </div>
    )
}
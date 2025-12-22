import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Documentation - CaptureAI',
    description: 'Learn how to use CaptureAI effectively',
}

export default function DocsPage() {
    return (
        <div className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-5xl font-bold text-gray-900 mb-6">Documentation</h1>
                <p className="text-xl text-gray-600 mb-12">
                    Everything you need to know about using CaptureAI
                </p>

                {/* Getting Started */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Getting Started</h2>

                    <div className="prose prose-lg max-w-none">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Installation</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                            <li>Visit the Chrome Web Store</li>
                            <li>Click "Add to Chrome"</li>
                            <li>Pin the extension to your toolbar for easy access</li>
                            <li>Create an account to start using CaptureAI</li>
                        </ol>

                        <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Quick Capture</h3>
                        <p className="text-gray-700 mb-4">
                            The fastest way to capture and analyze screenshots:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                            <li>Press <code className="bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+X</code> (or <code className="bg-gray-100 px-2 py-1 rounded">Cmd+Shift+X</code> on Mac)</li>
                            <li>Click and drag to select the area you want to capture</li>
                            <li>Type your question in the popup</li>
                            <li>Get instant AI-powered answers!</li>
                        </ol>

                        <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Ask Mode</h3>
                        <p className="text-gray-700 mb-4">
                            Capture first, ask questions later:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                            <li>Click the CaptureAI icon in your toolbar</li>
                            <li>Click "Ask Mode"</li>
                            <li>Capture an area of your screen</li>
                            <li>The screenshot is stored - ask questions anytime</li>
                        </ol>
                    </div>
                </section>

                {/* Features */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Features</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">AI Analysis</h3>
                            <p className="text-gray-700">
                                CaptureAI uses advanced AI models to analyze your screenshots and provide intelligent answers.
                                You can ask questions about text, images, diagrams, code, and more.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Prompt Templates</h3>
                            <p className="text-gray-700 mb-2">
                                Choose from built-in prompt templates for common tasks:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li><strong>General:</strong> Get a general analysis of your screenshot</li>
                                <li><strong>Solve Problem:</strong> Get step-by-step solutions to problems</li>
                                <li><strong>Explain:</strong> Get detailed explanations of concepts</li>
                                <li><strong>Summarize:</strong> Get concise summaries of content</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Usage Tracking</h3>
                            <p className="text-gray-700">
                                Monitor your API usage in the extension popup. Free tier users get 10 requests per day,
                                while Pro users get unlimited requests.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">FAQ</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                How does CaptureAI protect my privacy?
                            </h3>
                            <p className="text-gray-700">
                                Screenshots are sent directly to OpenAI's API for processing and are never stored on our servers.
                                We don't collect or store any of your screenshot data.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                What happens when I reach my daily limit?
                            </h3>
                            <p className="text-gray-700">
                                Free tier users are limited to 10 AI requests per day. Once you reach this limit, you'll need to
                                wait for the daily reset (midnight UTC) or upgrade to Pro for unlimited requests.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Can I use CaptureAI on other browsers?
                            </h3>
                            <p className="text-gray-700">
                                CaptureAI works on any Chromium-based browser including Chrome, Edge, Brave, Opera, and Vivaldi.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                How do I upgrade to Pro?
                            </h3>
                            <p className="text-gray-700">
                                Click the "Upgrade to Pro" button in the extension popup to start your subscription.
                                You'll be redirected to Stripe for secure payment processing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Support */}
                <section>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Need Help?</h2>
                    <p className="text-gray-700 mb-4">
                        Can't find what you're looking for? We're here to help!
                    </p>
                    <a
                        href="/contact"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Contact Support
                    </a>
                </section>
            </div>
        </div>
    )
}
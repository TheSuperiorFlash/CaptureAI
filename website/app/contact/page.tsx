import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact - CaptureAI',
    description: 'Get in touch with the CaptureAI team',
}

export default function ContactPage() {
    return (
        <div className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                    <p className="text-xl text-gray-600">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Email */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Email Support</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Send us an email and we'll get back to you within 24 hours.
                        </p>
                        <a
                            href="mailto:support@captureai.com"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            support@captureai.com
                        </a>
                    </div>

                    {/* Feedback */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                                <MessageCircle className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Feature Requests</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Have an idea for a new feature? We'd love to hear it!
                        </p>
                        <a
                            href="mailto:feedback@captureai.com"
                            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            feedback@captureai.com
                        </a>
                    </div>
                </div>

                {/* FAQ Link */}
                <div className="mt-16 text-center bg-white rounded-2xl shadow-xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Looking for answers?
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Check out our documentation for guides and frequently asked questions
                    </p>
                    <a
                        href="/docs"
                        className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        View Documentation
                    </a>
                </div>
            </div>
        </div>
    )
}
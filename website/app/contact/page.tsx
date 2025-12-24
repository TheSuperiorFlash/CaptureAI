import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact - CaptureAI',
    description: 'Get in touch with the CaptureAI team',
}

export default function ContactPage() {
    return (
        <div className="py-24 bg-[#08070e] min-h-screen relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur animate-pulse-glow"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500 gradient-blur animate-float"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Get in Touch</h1>
                    <p className="text-xl text-gray-300">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Email */}
                    <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm p-8 hover:border-blue-500/50 transition-all">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mr-4">
                                <Mail className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Email Support</h2>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Send us an email and we'll get back to you within 24 hours.
                        </p>
                        <a
                            href="mailto:support@captureai.dev"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            support@captureai.dev
                        </a>
                    </div>

                    {/* Feedback */}
                    <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm p-8 hover:border-cyan-500/50 transition-all">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mr-4">
                                <MessageCircle className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Feature Requests</h2>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Have an idea for a new feature? We'd love to hear it!
                        </p>
                        <a
                            href="mailto:feedback@captureai.dev"
                            className="inline-block px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105"
                        >
                            feedback@captureai.dev
                        </a>
                    </div>
                </div>

                {/* FAQ Link */}
                <div className="mt-16 text-center bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm p-8">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        Looking for answers?
                    </h3>
                    <p className="text-gray-300 mb-6">
                        Check out our documentation for guides and frequently asked questions
                    </p>
                    <a
                        href="/help"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                    >
                        View Documentation
                    </a>
                </div>
            </div>
        </div>
    )
}
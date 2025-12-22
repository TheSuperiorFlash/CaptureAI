import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
    return (
        <>
            <Hero />
            <Features />

            {/* How It Works Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600">
                            Three simple steps to get instant AI-powered answers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                1
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                                Capture
                            </h3>
                            <p className="text-gray-600">
                                Press Ctrl+Shift+X and select any area of your screen to capture
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                2
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                                Ask
                            </h3>
                            <p className="text-gray-600">
                                Type your question about the captured image or let AI analyze it automatically
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                3
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                                Get Answers
                            </h3>
                            <p className="text-gray-600">
                                Receive intelligent, AI-powered answers in seconds - no manual work required
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to work smarter?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Join thousands of users who are already using CaptureAI to boost their productivity
                    </p>
                    <Link
                        href="/download"
                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-xl"
                    >
                        Get Started for Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </section>
        </>
    )
}
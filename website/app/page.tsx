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
            <section className="py-24 bg-gradient-to-b from-gray-950/50 to-[#08070e] relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-400">
                            Three simple steps to get instant AI-powered answers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-110">
                                1
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">
                                Capture
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                Press Ctrl+Shift+X and select any area of your screen to capture
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-110">
                                2
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">
                                Ask
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                Type your question about the captured image or let AI analyze it automatically
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:scale-110">
                                3
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">
                                Get Answers
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                Receive intelligent, AI-powered answers in seconds - no manual work required
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-[#08070e] relative overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 gradient-blur"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 gradient-blur"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to work smarter?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                        Join thousands of users who are already using CaptureAI to boost their productivity
                    </p>
                    <Link
                        href="/download"
                        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                    >
                        Get Started for Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </section>
        </>
    )
}
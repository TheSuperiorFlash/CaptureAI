import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'CaptureAI - AI Homework Helper Chrome Extension | Get Instant Screenshot Answers',
    description: 'AI-powered homework helper Chrome extension. Screenshot any question and get instant answers. Perfect for students - solve homework, ace quizzes, and study smarter with AI screenshot analysis.',
    openGraph: {
        title: 'CaptureAI - AI Homework Helper Chrome Extension | Screenshot Answers',
        description: 'Screenshot any question and get instant AI-powered answers. Works on Canvas, Moodle, Blackboard, and all learning platforms.',
        images: ['/og-image.png'],
    },
}

export default function Home() {
    return (
        <>
            <Hero />

            {/* Floating UI Section */}
            <section className="py-24 bg-gradient-to-b from-gray-950/50 to-[#08070e] relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Image on the left */}
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
                                <Image
                                    src="/floating-ui.png"
                                    alt="CaptureAI Floating UI"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Content on the right */}
                        <div>
                            <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                                <span className="text-blue-400 text-sm font-semibold">Always Accessible</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Floating UI
                            </h2>
                            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                                Access CaptureAI anytime with our intuitive floating interface. No need to search for the extension - it's always just one click away, ready to help you solve problems instantly.
                            </p>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                The floating UI keeps your workflow smooth and uninterrupted. Whether you're taking a quiz, doing homework, or studying, CaptureAI is right there when you need it.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Guard Section */}
            <section className="py-24 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                            <span className="text-purple-400 text-sm font-semibold">PRO Feature</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Privacy Guard
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Privacy Guard keeps your activity completely hidden. When enabled, your quiz platform won't detect any extension usage - it's like you're browsing normally.
                        </p>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Without Privacy Guard */}
                        <div className="relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                <span className="inline-block px-4 py-2 bg-red-500 border border-red-500 rounded-full text-white text-sm font-semibold shadow-lg">
                                    ✗ Privacy Guard OFF
                                </span>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10 border-2 border-red-500/50">
                                <Image
                                    src="/action-log-canvas-1.png"
                                    alt="Canvas Action Log without Privacy Guard - shows extension activity"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto block"
                                />
                            </div>
                            <p className="text-center text-gray-400 mt-4">
                                Extension activity is visible and traceable
                            </p>
                        </div>

                        {/* With Privacy Guard */}
                        <div className="relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                <span className="inline-block px-4 py-2 bg-green-500 border border-green-500 rounded-full text-white text-sm font-semibold shadow-lg">
                                    ✓ Privacy Guard ON
                                </span>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10 border-2 border-green-500/50">
                                <Image
                                    src="/action-log-canvas-2.png"
                                    alt="Canvas Action Log with Privacy Guard - shows clean activity"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto block"
                                />
                            </div>
                            <p className="text-center text-gray-400 mt-4">
                                Clean logs showing only natural browsing
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Features />

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-gradient-to-b from-gray-950/50 to-[#08070e] relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Simple pricing
                        </h2>
                        <p className="text-xl text-gray-400">
                            Start free, upgrade when you need more
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
                            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                            <div className="text-4xl font-bold text-white mb-6">
                                $0<span className="text-lg text-gray-400 font-normal">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">10 requests per day</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">Core features</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">Question capture</span>
                                </li>
                            </ul>
                            <Link
                                href="/activate"
                                className="block w-full text-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold"
                            >
                                Start Free
                            </Link>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-gradient-to-b from-blue-900/30 to-blue-900/10 border border-[#667eea]/50 rounded-2xl p-8 hover:border-[#667eea] transition-all relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white text-sm font-semibold rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <div className="text-4xl font-bold text-white mb-6">
                                $9.99<span className="text-lg text-gray-400 font-normal">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">Unlimited requests</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">All features unlocked</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-400 mr-3">✓</span>
                                    <span className="text-gray-300">Privacy Guard</span>
                                </li>
                            </ul>
                            <Link
                                href="/activate"
                                className="block w-full text-center px-6 py-3 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-lg shadow-[#667eea]/20"
                            >
                                Get Pro
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Can I upgrade or downgrade anytime?
                            </h3>
                            <p className="text-gray-400">
                                Yes! You can upgrade to Pro anytime, and cancel your subscription whenever you want.
                                No questions asked.
                            </p>
                        </div>
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                What happens when I hit the free tier limit?
                            </h3>
                            <p className="text-gray-400">
                                You'll receive a notification when you approach your daily limit. You can either wait
                                for the daily reset or upgrade to Pro for unlimited requests.
                            </p>
                        </div>
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Is my data secure?
                            </h3>
                            <p className="text-gray-400">
                                Absolutely. We process screenshots securely and never store them on our servers.
                                Your privacy is our top priority.
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
                        Ready to ace your next assignment?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                        Join students using CaptureAI to study smarter, not harder
                    </p>
                    <Link
                        href="/activate"
                        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                    >
                        Try Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </section>
        </>
    )
}
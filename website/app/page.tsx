import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
    return (
        <>
            <Hero />
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
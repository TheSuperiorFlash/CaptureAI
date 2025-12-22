import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Camera, Brain, Sparkles } from 'lucide-react'

export default function Home() {
    return (
        <>
            <Hero />

            {/* How It Works Section */}
            <section className="py-24 bg-gradient-to-b from-gray-950/50 to-[#08070e] relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                            <span className="text-sm text-cyan-300 font-semibold">HOW IT WORKS</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Get answers in 3 simple steps
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            It&apos;s incredibly easy to use - no complicated setup required
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Step 1 */}
                        <div className="relative">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/30 relative">
                                    <Camera className="w-10 h-10 text-white" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">1</div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Capture</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Press Ctrl+Shift+X and select any question on your screen
                                </p>
                            </div>
                            {/* Connector line for desktop */}
                            <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent -z-10"></div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mb-6 shadow-lg shadow-cyan-500/30 relative">
                                    <Brain className="w-10 h-10 text-white" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">2</div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Analyze</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Our AI instantly processes and understands your question
                                </p>
                            </div>
                            {/* Connector line for desktop */}
                            <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent -z-10"></div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl mb-6 shadow-lg shadow-blue-600/30 relative">
                                    <Sparkles className="w-10 h-10 text-white" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">3</div>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Get Answer</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Receive accurate answers in seconds, right where you need them
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Features />

            {/* Pricing Section */}
            <section className="py-24 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur"></div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                            <span className="text-sm text-blue-300 font-semibold">PRICING</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Choose your plan
                        </h2>
                        <p className="text-xl text-gray-400">
                            Start free, upgrade when you need unlimited access
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all backdrop-blur-sm">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                                <p className="text-gray-400">Perfect to get started</p>
                            </div>
                            <div className="text-5xl font-bold text-white mb-8">
                                $0<span className="text-xl text-gray-400 font-normal">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">10 questions per day</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">All core features</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Works on any website</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-300">Stealth mode included</span>
                                </li>
                            </ul>
                            <Link
                                href="/activate"
                                className="block w-full text-center px-6 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold text-lg"
                            >
                                Start Free
                            </Link>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-gradient-to-b from-blue-900/30 to-blue-900/10 border-2 border-blue-500/50 rounded-2xl p-8 hover:border-blue-500 transition-all relative shadow-xl shadow-blue-500/20 backdrop-blur-sm transform hover:scale-105">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-full shadow-lg">
                                MOST POPULAR
                            </div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                <p className="text-gray-300">For serious students</p>
                            </div>
                            <div className="text-5xl font-bold text-white mb-8">
                                $9.99<span className="text-xl text-gray-400 font-normal">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-200 font-medium">Unlimited questions</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-200 font-medium">All features unlocked</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-200 font-medium">Priority AI processing</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-200 font-medium">Premium support</span>
                                </li>
                            </ul>
                            <Link
                                href="/activate"
                                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                            >
                                Get Pro Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-b from-gray-950/50 to-[#08070e] relative overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 gradient-blur"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 gradient-blur"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Ready to transform your studying?
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
                        Join students using CaptureAI to study smarter, save time, and get better grades
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/activate"
                            className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xl font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/download"
                            className="inline-flex items-center justify-center px-10 py-5 bg-transparent text-white text-xl font-bold rounded-lg hover:bg-white/5 transition-all border-2 border-white/20 hover:border-blue-500/50"
                        >
                            Download Extension
                        </Link>
                    </div>
                    <p className="mt-8 text-gray-500 text-sm">
                        No credit card required • Free to start • Cancel anytime
                    </p>
                </div>
            </section>
        </>
    )
}
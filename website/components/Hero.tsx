import Link from 'next/link'
import { Zap, CheckCircle } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative bg-[#08070e] pt-20 pb-32 overflow-hidden">
            {/* Animated gradient blobs */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur animate-pulse-glow"></div>
            <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-400 gradient-blur animate-float"></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500 gradient-blur animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Get answers to any question
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                            instantly
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Screenshot your homework, quizzes, or study materials and get instant AI-powered answers.
                        Works on any website.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/activate"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/50"
                        >
                            <Zap className="w-5 h-5 mr-2" />
                            Try Now - Free
                        </Link>
                        <Link
                            href="/#features"
                            className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-gray-200 text-lg font-semibold rounded-lg hover:bg-white/5 transition-all border border-gray-600"
                        >
                            See Features
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span>Free to start</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span>Works on any website</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                            <span>Your screenshots stay private</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

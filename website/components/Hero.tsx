import Link from 'next/link'
import { Zap, Download } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative bg-[#08070e] pt-20 pb-32 overflow-hidden">
            {/* Animated gradient blobs */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur animate-pulse-glow"></div>
            <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-400 gradient-blur animate-float"></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500 gradient-blur animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
                        <Zap className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-blue-300">Now with AI-powered analysis</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Screenshot + AI =
                        <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {' '}Instant Answers
            </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Capture any part of your screen and ask questions. CaptureAI analyzes images instantly
                        and provides intelligent answers powered by advanced AI.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/download"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Add to Chrome - It's Free
                        </Link>
                        <Link
                            href="/#features"
                            className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-gray-200 text-lg font-semibold rounded-lg hover:bg-white/5 transition-all border border-gray-700 hover:border-blue-500/50"
                        >
                            See How It Works
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">⭐⭐⭐⭐⭐</span>
                            <span>4.8/5 Rating</span>
                        </div>
                        <div>10,000+ Users</div>
                        <div>Free Plan Available</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
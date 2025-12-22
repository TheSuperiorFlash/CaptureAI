import Link from 'next/link'
import { Zap, Download } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-8">
                        <Zap className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-600">Now with AI-powered analysis</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Screenshot + AI =
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Instant Answers
            </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Capture any part of your screen and ask questions. CaptureAI analyzes images instantly
                        and provides intelligent answers powered by advanced AI.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/download"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Add to Chrome - It's Free
                        </Link>
                        <Link
                            href="/#features"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all border-2 border-gray-200"
                        >
                            See How It Works
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
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
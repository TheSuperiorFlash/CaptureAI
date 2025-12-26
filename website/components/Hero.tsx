'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Zap, Download, CheckCircle, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'

const headlines = [
    { text: 'Get answers to any question', highlight: 'instantly' },
    { text: 'Solve homework problems', highlight: 'effortlessly' },
    { text: 'Ace your exams with AI', highlight: 'guaranteed' },
    { text: 'Study smarter, not harder', highlight: 'with CaptureAI' },
]

export default function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false)
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % headlines.length)
                setIsVisible(true)
            }, 500)
        }, 6000)

        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative bg-[#08070e] pt-20 pb-32 overflow-hidden">
            {/* Animated gradient blobs */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur animate-pulse-glow"></div>
            <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-400 gradient-blur animate-float"></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500 gradient-blur animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight min-h-[200px] md:min-h-[240px] flex flex-col items-center justify-center">
                        <span
                            className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                            {headlines[currentIndex].text}
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                {headlines[currentIndex].highlight}
                            </span>
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
                            className="inline-flex items-center justify-center px-12 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                        >
                            <Zap className="w-5 h-5 mr-2" />
                            Try Now
                        </Link>
                    </div>

                    {/* Platform Compatibility */}
                    <div className="mt-16">
                        <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                            Works on all learning platforms & sites, including these:
                        </p>
                        <div className="flex items-center justify-center gap-8 md:gap-12">
                            <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                                <Image src="/platforms/canvas.png" alt="Canvas" width={120} height={40} className="h-10 w-auto" />
                            </div>
                            <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100 mt-1">
                                <Image src="/platforms/respondus.png" alt="Respondus" width={120} height={40} className="h-9 w-auto" />
                            </div>
                            <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                                <Image src="/platforms/moodle.png" alt="Moodle" width={120} height={40} className="h-10 w-auto" />
                            </div>
                            <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                                <Image src="/platforms/blackboard.png" alt="Blackboard" width={120} height={40} className="h-6 w-auto" />
                            </div>
                            <div className="grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
                                <Image src="/platforms/tophat.png" alt="Top Hat" width={120} height={40} className="h-6 w-auto" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
import type { Metadata } from 'next'
import { Chrome, Download, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Download CaptureAI - Free AI Homework Helper Chrome Extension',
    description: 'Download CaptureAI Chrome extension for free. AI-powered homework helper that gives instant screenshot answers. Works on Canvas, Moodle, Blackboard, and all learning platforms.',
    openGraph: {
        title: 'Download CaptureAI - AI Homework Helper Chrome Extension',
        description: 'Free Chrome extension for students. Screenshot any question and get instant AI-powered answers.',
        images: ['/og-image.png'],
    },
}

export default function DownloadPage() {
    return (
        <div className="py-24 bg-[#08070e] min-h-screen relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500 gradient-blur animate-pulse-glow"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500 gradient-blur animate-float"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full mb-6 shadow-lg shadow-blue-500/30">
                        <Download className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Download CaptureAI
                    </h1>
                    <p className="text-xl text-gray-300">
                        Install the extension and start boosting your productivity today
                    </p>
                </div>

                {/* Download Card */}
                <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm p-8 md:p-12 mb-12">
                    <div className="flex items-center mb-6">
                        <Chrome className="w-12 h-12 text-blue-400 mr-4" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Chrome Extension</h2>
                            <p className="text-gray-400">For Google Chrome</p>
                        </div>
                    </div>

                    <a
                        href="https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkpmmkecmoeomnjd?authuser=0&hl=en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-4 bg-blue-600 text-white text-center text-lg font-semibold rounded-lg hover:bg-blue-500 transition-all mb-6 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                    >
                        Add to Chrome - It's Free
                    </a>
                </div>

                {/* Installation Steps */}
                <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-2xl backdrop-blur-sm p-8 md:p-12">
                    <h3 className="text-2xl font-bold text-white mb-8">Installation Guide</h3>

                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 shadow-lg shadow-blue-500/30">
                                1
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-2">
                                    Click "Add to Chrome"
                                </h4>
                                <p className="text-gray-400">
                                    Click the button above to open the Chrome Web Store listing
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 shadow-lg shadow-blue-500/30">
                                2
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-2">
                                    Install the extension
                                </h4>
                                <p className="text-gray-400">
                                    Click "Add to Chrome" in the Chrome Web Store and confirm the installation
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 shadow-lg shadow-blue-500/30">
                                3
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-2">
                                    Get your license key
                                </h4>
                                <p className="text-gray-400">
                                    Visit <a href="/activate" className="text-blue-400 hover:text-blue-300 underline">captureai.dev/activate</a> to get your free license key
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 shadow-lg shadow-blue-500/30">
                                4
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-2">
                                    Activate and start using!
                                </h4>
                                <p className="text-gray-400">
                                    Enter your license key in the extension, then press Ctrl+Shift+X to capture any area of your screen and get instant AI-powered answers
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requirements */}
                <div className="mt-12 bg-gradient-to-b from-gray-900/30 to-gray-900/20 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
                    <h4 className="text-lg font-semibold text-white mb-4">System Requirements</h4>
                    <ul className="space-y-2">
                        <li className="flex items-center text-gray-300">
                            <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                            Google Chrome 88 or later
                        </li>
                        <li className="flex items-center text-gray-300">
                            <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                            Internet connection required
                        </li>
                        <li className="flex items-center text-gray-300">
                            <CheckCircle className="w-5 h-5 text-blue-400 mr-3" />
                            Free CaptureAI license key (get one at /activate)
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
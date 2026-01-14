'use client'

import Link from 'next/link'
import { Star, Shield, Users } from 'lucide-react'

export default function TrustBadges() {
    return (
        <section className="py-16 bg-gradient-to-b from-[#08070e] to-gray-950/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Trusted by Students Worldwide
                    </h2>
                    <p className="text-lg text-gray-400">
                        Available on Chrome Web Store with a proven track record
                    </p>
                </div>

                <div className="flex flex-col items-center gap-8">
                    {/* Chrome Web Store Badge */}
                    <div className="flex justify-center">
                        <Link
                            href="https://chromewebstore.google.com/detail/captureai/idpdleplccjjbmdmjkppmkecmoeomnjd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block transition-transform hover:scale-105"
                        >
                            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all shadow-lg">
                                {/* Chrome Icon */}
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="24" cy="24" r="22" fill="#4285F4"/>
                                    <path d="M24 16C19.5817 16 16 19.5817 16 24C16 28.4183 19.5817 32 24 32C28.4183 32 32 28.4183 32 24C32 19.5817 28.4183 16 24 16ZM24 28C21.7909 28 20 26.2091 20 24C20 21.7909 21.7909 20 24 20C26.2091 20 28 21.7909 28 24C28 26.2091 26.2091 28 24 28Z" fill="white"/>
                                    <path d="M24 8C15.1634 8 8 15.1634 8 24C8 28.2652 9.68571 32.1429 12.4286 35.0476L18.8571 24.3809C18.8571 19.9429 22.4 16.3809 26.8571 16.3809H39.4286C36.9524 11.2381 30.9524 8 24 8Z" fill="#EA4335"/>
                                    <path d="M24 40C30.9524 40 36.9524 36.7619 39.4286 31.619H26.8571C24.4762 31.619 22.4 30.3809 21.1429 28.5714L12.4286 35.0476C15.3143 37.7905 19.4286 40 24 40Z" fill="#34A853"/>
                                    <path d="M39.4286 31.619C41.0476 28.9524 42 25.619 42 24C42 22.3809 41.7143 20.8571 41.2381 19.4286H26.8571C28.9524 19.4286 30.6667 21.1429 30.6667 23.2381V24.7619C30.6667 26.8571 28.9524 28.5714 26.8571 28.5714H21.1429L12.4286 35.0476C15.3143 37.7905 19.4286 40 24 40C30.9524 40 36.9524 36.7619 39.4286 31.619Z" fill="#FBBC04"/>
                                </svg>
                                
                                <div className="text-left">
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">Available on</div>
                                    <div className="text-xl font-bold text-white">Chrome Web Store</div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all">
                            <div className="flex justify-center mb-3">
                                <Star className="w-8 h-8 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">4.5+</div>
                            <div className="text-sm text-gray-400">Average Rating</div>
                        </div>

                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all">
                            <div className="flex justify-center mb-3">
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">10,000+</div>
                            <div className="text-sm text-gray-400">Active Users</div>
                        </div>

                        <div className="bg-gradient-to-b from-gray-900/50 to-gray-900/30 border border-gray-800 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all">
                            <div className="flex justify-center mb-3">
                                <Shield className="w-8 h-8 text-green-400" />
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">Privacy First</div>
                            <div className="text-sm text-gray-400">No Data Collection</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

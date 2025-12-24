'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    const navigation = [
        { name: 'How It Works', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Download', href: '/download' },
        { name: 'Help', href: '/help' },
    ]

    return (
        <nav className="bg-[#08070e]/80 backdrop-blur-lg border-b border-gray-800/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/icon128.png" alt="CaptureAI" width={32} height={32} />
                            <span className="text-xl font-bold text-white">CaptureAI</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-gray-300 hover:text-blue-400 transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Try Now Button - Right Side */}
                    <div className="hidden md:flex items-center">
                        <Link
                            href="/activate"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            Try Now
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-blue-400"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
                    <div className="px-4 py-4 space-y-3">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="block text-gray-300 hover:text-blue-400 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link
                            href="/activate"
                            className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors text-center"
                            onClick={() => setIsOpen(false)}
                        >
                            Try Now
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
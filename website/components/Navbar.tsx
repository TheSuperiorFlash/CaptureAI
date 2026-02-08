'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const navigation = [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Download', href: '/download' },
        { name: 'Help', href: '/help' },
    ]

    const isActive = (href: string) => {
        if (href.startsWith('/#')) return pathname === '/'
        return pathname === href
    }

    return (
        <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[--color-background]/80 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src="/icon128.png" alt="CaptureAI" width={28} height={28} />
                        <span className="text-[15px] font-semibold text-[--color-text]">CaptureAI</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-sm transition-colors duration-200 ${
                                    isActive(item.href)
                                        ? 'text-[--color-text] font-medium'
                                        : 'text-[--color-text-tertiary] hover:text-[--color-text-secondary]'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="hidden md:block">
                        <Link
                            href="/activate"
                            className="glow-btn inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-[--color-text-tertiary] hover:text-[--color-text] md:hidden"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="border-t border-white/[0.04] bg-[--color-background]/95 backdrop-blur-xl md:hidden">
                    <div className="space-y-1 px-6 py-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                    isActive(item.href)
                                        ? 'text-[--color-text] font-medium'
                                        : 'text-[--color-text-tertiary] hover:text-[--color-text]'
                                }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-2">
                            <Link
                                href="/activate"
                                className="glow-btn block rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-center text-sm font-medium text-white"
                                onClick={() => setIsOpen(false)}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

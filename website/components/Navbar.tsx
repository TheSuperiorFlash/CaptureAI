'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const [activeHash, setActiveHash] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // Check on mount

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const updateHash = () => setActiveHash(window.location.hash)

        // Update hash immediately on mount and when pathname changes
        updateHash()

        // Listen for native hashchange events (e.g., clicking anchor links)
        window.addEventListener('hashchange', updateHash)

        return () => {
            window.removeEventListener('hashchange', updateHash)
        }
    }, [pathname])

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden')
        } else {
            document.body.classList.remove('overflow-hidden')
        }

        return () => {
            document.body.classList.remove('overflow-hidden')
        }
    }, [isOpen])

    const navigation = [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Download', href: '/download' },
        { name: 'Help', href: '/help' },
    ]

    const isActive = (href: string) => {
        if (href.startsWith('/#')) {
            const hash = href.slice(1)
            return pathname === '/' && activeHash === hash
        }
        return pathname === href
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'border-b border-white/[0.04] bg-[--color-background]/80 backdrop-blur-xl' : 'bg-transparent border-transparent'}`}>
            <div className={`absolute inset-x-0 top-0 h-40 -z-10 pointer-events-none bg-gradient-to-b from-[#001e80] via-[#001e80]/40 to-transparent transition-opacity duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'}`} />
            <div className="mx-auto max-w-6xl px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src="/logo.svg" alt="CaptureAI" width={28} height={28} />
                        <span className="text-[15px] font-semibold text-[--color-text]">CaptureAI</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-sm transition-colors duration-200 ${isActive(item.href)
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
                            className="glow-btn inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                        >
                            Get Started
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
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
                                className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive(item.href)
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
                                className="glow-btn flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white"
                                onClick={() => setIsOpen(false)}
                            >
                                Get Started
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

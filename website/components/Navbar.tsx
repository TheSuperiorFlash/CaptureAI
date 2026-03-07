'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import MagneticButton from './MagneticButton'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const [activeHash, setActiveHash] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [isLowPerformance, setIsLowPerformance] = useState(false)
    const [isReducedMotion, setIsReducedMotion] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isSafari, setIsSafari] = useState(false)
    const [activePillIndex, setActivePillIndex] = useState<number | null>(null)
    const [isNavHovered, setIsNavHovered] = useState(false)
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = (index: number) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
        setActivePillIndex(index)
        setIsNavHovered(true)
    }

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsNavHovered(false)
        }, 25)
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        const mqlTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
        const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

        const checkPerformance = () => {
            setIsLowPerformance(mqlTransparency.matches || mqlMotion.matches)
            setIsReducedMotion(mqlMotion.matches)
        }

        const checkSafari = () => {
            const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            setIsSafari(isSafariBrowser)
        }

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        // Debounce resize to avoid frequent state updates
        let resizeTimer: ReturnType<typeof setTimeout> | null = null
        const debouncedResize = () => {
            if (resizeTimer) clearTimeout(resizeTimer)
            resizeTimer = setTimeout(handleResize, 150)
        }

        checkPerformance()
        checkSafari()
        handleResize()

        mqlTransparency.addEventListener('change', checkPerformance)
        mqlMotion.addEventListener('change', checkPerformance)
        window.addEventListener('resize', debouncedResize, { passive: true })
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // Check on mount

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', debouncedResize)
            if (resizeTimer) clearTimeout(resizeTimer)
            mqlTransparency.removeEventListener('change', checkPerformance)
            mqlMotion.removeEventListener('change', checkPerformance)
        }
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

    const shouldUseSimpleGlass = isLowPerformance || isMobile || isSafari

    return (
        <nav className="fixed left-0 right-0 top-0 z-50 flex flex-col items-center pt-0 md:pt-5 transition-all duration-300 pointer-events-none">
            {/* SVG Displacement Engine for Liquid Glass */}
            <svg style={{ display: 'none' }}>
                <filter id="displacementFilter">
                    <feImage href="data:image/png;base64,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" result="turbulence" preserveAspectRatio="none" />
                    <feDisplacementMap in="SourceGraphic"
                        in2="turbulence"
                        scale="200" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            {/* The Floating Pill */}
            <div className={`pointer-events-auto relative mx-auto flex h-16 w-full items-center justify-between md:h-14 transition-[max-width,padding] duration-400 ease-out ${isScrolled ? 'max-w-full md:max-w-3xl pl-5 pr-5 md:pl-6 md:pr-3' : 'max-w-full md:max-w-5xl px-5 md:px-6'}`}>
                {/* Glass background layer — fades in/out independently */}
                <motion.div
                    className={`absolute inset-0 md:rounded-full pointer-events-none ${shouldUseSimpleGlass
                        ? 'border-b md:border border-white/[0.08] bg-[#060913]/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                        : 'border-b md:border border-white/[0.02] bg-[#000000]/10 drop-shadow-[-8px_-10px_46px_rgba(0,0,0,0.37)]'
                        }`}
                    style={!shouldUseSimpleGlass ? {
                        backdropFilter: 'brightness(1.1) blur(2px) url(#displacementFilter)',
                        WebkitBackdropFilter: 'brightness(1.1) blur(2px) url(#displacementFilter)',
                        boxShadow: 'inset 2px 2px 0px -2px rgba(255, 255, 255, 0.5), inset 0 0 3px 1px rgba(255, 255, 255, 0.4)'
                    } : undefined}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isScrolled ? 1 : 0 }}
                    transition={{ duration: isScrolled ? 0.15 : 0.3, ease: 'easeOut' }}
                />
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 relative z-10 hover:opacity-80 transition-opacity">
                    <Image src="/logo.svg" alt="CaptureAI" width={28} height={28} />
                    <span className="text-[15px] font-semibold text-[--color-text]">CaptureAI</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-2 md:flex relative z-10" onMouseLeave={handleMouseLeave}>
                    {navigation.map((item, index) => (
                        <div
                            key={item.name}
                            className="relative px-4 py-2 flex items-center justify-center cursor-pointer"
                            onMouseEnter={() => handleMouseEnter(index)}
                        >
                            {activePillIndex === index && !isReducedMotion && (
                                <motion.div
                                    layoutId="nav-hover-pill"
                                    className={`absolute inset-0 rounded-full ${shouldUseSimpleGlass
                                        ? 'bg-white/[0.06] backdrop-blur-md'
                                        : 'border border-white/[0.02] bg-white/[0.02]'
                                        }`}
                                    style={!shouldUseSimpleGlass ? {
                                        backdropFilter: 'brightness(0.9) blur(4px) url(#displacementFilter)',
                                        WebkitBackdropFilter: 'brightness(0.9) blur(4px) url(#displacementFilter)',
                                        boxShadow: 'inset 2px 2px 0px -2px rgba(255, 255, 255, 0.3), inset 0 0 3px 1px rgba(255, 255, 255, 0.3)'
                                    } : undefined}
                                    animate={{ opacity: isNavHovered ? 1 : 0 }}
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5, opacity: { duration: 0.2 } }}
                                />
                            )}
                            <Link
                                href={item.href}
                                className={`relative z-10 text-sm font-medium transition-colors duration-200 ${isActive(item.href)
                                    ? 'text-[--color-text]'
                                    : 'text-[--color-text-tertiary] hover:text-[--color-text]'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center relative z-10">
                    <MagneticButton magneticRange={10}>
                        <motion.div
                            animate={{
                                borderRadius: isScrolled ? "100px" : "12px"
                            }}
                            transition={{
                                duration: 0.75,
                                ease: [0.25, 1, 0.5, 1]
                            }}
                            className="overflow-hidden flex items-center justify-center"
                        >
                            <Link
                                href="/activate"
                                className="glow-btn inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:from-blue-500 hover:to-cyan-500 whitespace-nowrap"
                            >
                                Get Started
                            </Link>
                        </motion.div>
                    </MagneticButton>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative z-10 text-[--color-text-tertiary] hover:text-[--color-text] md:hidden ${!isScrolled && isOpen ? 'opacity-0 pointer-events-none' : ''}`}
                    aria-hidden={!isScrolled && isOpen}
                    tabIndex={!isScrolled && isOpen ? -1 : undefined}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="pointer-events-auto transition-all duration-300 md:hidden absolute right-3 top-3 z-50 flex w-[45%] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060913]/60 shadow-2xl backdrop-blur-2xl">
                    <div className="flex justify-end pr-2 pt-[10px] pb-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[--color-text-tertiary] hover:text-[--color-text] transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex flex-col space-y-1 px-3 pb-3">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block w-full rounded-lg px-3 py-2.5 text-sm transition-colors text-center ${isActive(item.href)
                                    ? 'text-[--color-text] font-medium'
                                    : 'text-[--color-text-tertiary] hover:text-[--color-text]'
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="w-full pt-1 pb-1">
                            <Link
                                href="/activate"
                                className="glow-btn flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 font-semibold text-white text-[13px] px-2 h-9"
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

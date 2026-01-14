'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'

interface AnnouncementBarProps {
    message: string
    linkText?: string
    linkHref?: string
    badge?: string
    storageKey?: string
}

// Animation duration in milliseconds (must match CSS transition)
const ANIMATION_DURATION = 300

export default function AnnouncementBar({
    message,
    linkText,
    linkHref,
    badge,
    storageKey = 'announcement-dismissed'
}: AnnouncementBarProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Check if announcement was previously dismissed
        if (typeof window !== 'undefined') {
            const isDismissed = localStorage.getItem(storageKey)
            if (!isDismissed) {
                setIsVisible(true)
            }
        }

        // Cleanup timeout on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [storageKey])

    const handleDismiss = () => {
        setIsClosing(true)
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false)
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, 'true')
            }
        }, ANIMATION_DURATION)
    }

    if (!isVisible) return null

    return (
        <div
            className={`relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 transition-all duration-300 ${
                isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center py-3 gap-3 flex-wrap">
                    {/* Badge (optional) */}
                    {badge && (
                        <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-semibold text-white">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {badge}
                        </span>
                    )}

                    {/* Message */}
                    <span className="text-white font-medium text-sm sm:text-base">
                        {message}
                    </span>

                    {/* Link (optional) */}
                    {linkText && linkHref && (
                        <Link
                            href={linkHref}
                            className="inline-flex items-center px-4 py-1.5 bg-white text-blue-600 font-semibold text-sm rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            {linkText}
                            <span className="ml-1">→</span>
                        </Link>
                    )}

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                        aria-label="Dismiss announcement"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

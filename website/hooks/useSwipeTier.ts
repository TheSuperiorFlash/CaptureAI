'use client'

import { useState, useRef, useCallback } from 'react'

/**
 * Shared hook for swiping between 'free' and 'pro' tiers on mobile.
 * Uses a ref for the touch coordinate to avoid extra renders and stale-value issues.
 */
export function useSwipeTier(options?: { threshold?: number }) {
    const threshold = options?.threshold ?? 40
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro'>('pro')
    const touchStartRef = useRef<number | null>(null)

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX
    }, [])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartRef.current === null) return
        const touchEnd = e.changedTouches[0].clientX
        const diff = touchStartRef.current - touchEnd
        if (diff > threshold) setSelectedTier('pro')   // swipe left → pro
        if (diff < -threshold) setSelectedTier('free')  // swipe right → free
        touchStartRef.current = null
    }, [threshold])

    const handleTouchCancel = useCallback(() => {
        touchStartRef.current = null
    }, [])

    return {
        selectedTier,
        setSelectedTier,
        handleTouchStart,
        handleTouchEnd,
        handleTouchCancel,
    }
}

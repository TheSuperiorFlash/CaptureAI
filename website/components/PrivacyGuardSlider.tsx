'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Check, X as XIcon, ChevronsLeftRight } from 'lucide-react'

export default function PrivacyGuardSlider() {
    const [sliderValue, setSliderValue] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        setSliderValue((x / rect.width) * 100)
    }

    const onPointerDown = (e: React.PointerEvent) => {
        setIsDragging(true)
        handleMove(e.clientX)
        // Set pointer capture to the container so we don't lose drag if moving outside fast
        if (containerRef.current) {
            containerRef.current.setPointerCapture(e.pointerId)
        }
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (isDragging) handleMove(e.clientX)
    }

    const onPointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        if (containerRef.current) {
            containerRef.current.releasePointerCapture(e.pointerId)
        }
    }

    return (
        <div className="glass-card relative overflow-hidden rounded-2xl p-5 md:hidden">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15">
                        <XIcon className="h-3.5 w-3.5 text-red-400" />
                    </span>
                    <span className="text-sm font-medium text-[--color-text-secondary]">Off</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-[--color-text-secondary]">On</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative w-full select-none overflow-hidden rounded-xl border border-white/[0.04] touch-none cursor-ew-resize"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                {/* Background (Off/Dirty) */}
                <Image
                    src="/action-log-canvas-1.png"
                    alt="Privacy Guard Off"
                    width={600}
                    height={600}
                    className="block h-auto w-full pointer-events-none"
                    priority
                />

                {/* Foreground (On/Clean) */}
                <div
                    className="absolute inset-0 z-10 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
                >
                    <Image
                        src="/action-log-canvas-2.png"
                        alt="Privacy Guard On"
                        width={600}
                        height={600}
                        className="absolute inset-0 block h-auto w-full max-w-none pointer-events-none object-contain"
                    />
                </div>

                {/* Slider Handle Line */}
                <div
                    className="absolute bottom-0 top-0 z-20 w-[2px] cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
                    style={{ left: `calc(${sliderValue}% - 1px)` }}
                >
                    {/* Circle with arrows inside the line */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 pointer-events-none text-black">
                        <ChevronsLeftRight className="h-4 w-4" />
                    </div>
                </div>
            </div>
            <p className="mt-4 text-center text-[13px] font-medium text-[--color-text-tertiary] uppercase tracking-wide">
                Drag to compare
            </p>
        </div>
    )
}

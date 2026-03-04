'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, X as XIcon } from 'lucide-react'

export default function PrivacyGuardSlider() {
    const [sliderValue, setSliderValue] = useState(50)

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

            <div className="relative w-full select-none overflow-hidden rounded-xl border border-white/[0.04]">
                {/* Background (Off) */}
                <Image
                    src="/action-log-canvas-1.png"
                    alt="Privacy Guard Off"
                    width={600}
                    height={600}
                    className="block h-auto w-full pointer-events-none"
                    priority
                />

                {/* Foreground (On) */}
                <div
                    className="absolute inset-0 z-10 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
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
                    className="absolute bottom-0 top-0 z-20 w-[2px] cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ left: `calc(${sliderValue}% - 1px)` }}
                />

                {/* Invisible Range Input */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 touch-none appearance-none"
                />
            </div>
            <p className="mt-4 text-center text-sm text-[--color-text-tertiary]">
                Drag to compare logs
            </p>
        </div>
    )
}

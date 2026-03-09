'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * Interactive replica of the extension's floating UI panel.
 * All dimensions are the original extension values × 1.75 to
 * match the exact extension proportions at a larger display size.
 * No CSS transform — every value is literal so height changes work correctly.
 */

// Scale factor applied to every pixel value from the original 250px panel
const S = 1.75
const BUTTON_RADIUS = 10 // Change to 24 for pilled, 10 for rounded

export default function FloatingUIShowcase() {
    const [isAskMode, setIsAskMode] = useState(false)

    return (
        <div
            style={{
                width: Math.round(250 * S),   // 437.5
                borderRadius: Math.round(18 * S),
                fontFamily: "'Inter', sans-serif",
                color: '#333333',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
            }}
        >
            {/* ---- Header ---- */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${Math.round(12 * S)}px ${Math.round(15 * S)}px`,
                    justifyContent: 'space-between',
                    backgroundColor: 'transparent',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Image
                        src="/logo.svg"
                        alt="CaptureAI"
                        width={Math.round(24 * S)}
                        height={Math.round(24 * S)}
                        style={{ marginRight: Math.round(10 * S) }}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: Math.round(16 * S), color: '#333333' }}>
                        CaptureAI
                    </span>
                </div>

                <ModeToggle isAskMode={isAskMode} onToggle={() => setIsAskMode(v => !v)} />
            </div>

            {/* ---- Response section ---- */}
            <div
                style={{
                    padding: `${Math.round(10 * S)}px ${Math.round(15 * S)}px`,
                    backgroundColor: 'transparent',
                    minHeight: Math.round(52 * S),
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ fontSize: Math.round(12 * S), color: '#666666', marginBottom: Math.round(5 * S) }}>
                    Response:
                </div>
                <div style={{ fontSize: Math.round(14 * S), color: '#333333', lineHeight: 1.3, minHeight: Math.round(18 * S) }} />
            </div>

            {/* ---- Capture mode ---- */}
            {!isAskMode && (
                <div
                    style={{
                        padding: Math.round(15 * S),
                        display: 'flex',
                        backgroundColor: 'transparent',
                        flexDirection: 'column',
                        gap: Math.round(10 * S),
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Capture a Question */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: Math.round(48 * S),
                            padding: `0 ${Math.round(15 * S)}px`,
                            backgroundColor: '#218aff',
                            borderRadius: Math.round(BUTTON_RADIUS * S),
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(33,138,255,0.3)',
                        }}
                    >
                        {/* Camera icon from extension */}
                        <Image
                            src="/camera.png"
                            alt="Camera"
                            width={Math.round(20 * S)}
                            height={Math.round(20 * S)}
                            style={{ marginRight: Math.round(10 * S) }}
                        />
                        <span style={{ fontWeight: 'bold', color: 'white', fontSize: Math.round(14 * S) }}>
                            Capture a Question
                        </span>
                    </div>

                    {/* Quick Capture */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: Math.round(48 * S),
                            padding: `0 ${Math.round(15 * S)}px`,
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            borderRadius: Math.round(BUTTON_RADIUS * S),
                            cursor: 'pointer',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <span style={{ fontWeight: 'bold', color: '#333333', fontSize: Math.round(14 * S) }}>
                            Quick Capture
                        </span>
                    </div>
                </div>
            )}

            {/* ---- Ask mode ---- */}
            {isAskMode && (
                <div
                    style={{
                        padding: Math.round(15 * S),
                        display: 'flex',
                        backgroundColor: 'transparent',
                        flexDirection: 'column',
                        gap: Math.round(10 * S),
                        boxSizing: 'border-box',
                    }}
                >
                    <textarea
                        readOnly
                        placeholder="Ask anything..."
                        style={{
                            width: '100%',
                            minHeight: Math.round(60 * S),
                            padding: Math.round(12 * S),
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: Math.round(12 * S),
                            fontFamily: "'Inter', sans-serif",
                            fontSize: Math.round(14 * S),
                            color: '#333333',
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            resize: 'none',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />

                    <div style={{ display: 'flex', gap: Math.round(8 * S) }}>
                        {/* Attach */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: Math.round(48 * S),
                                padding: `0 ${Math.round(12 * S)}px`,
                                width: Math.round(44 * S),
                                backgroundColor: 'rgba(0,0,0,0.03)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                borderRadius: Math.round(BUTTON_RADIUS * S),
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            <svg width={Math.round(20 * S)} height={Math.round(20 * S)} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                        </div>

                        {/* Ask Question */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: Math.round(48 * S),
                                padding: `0 ${Math.round(12 * S)}px`,
                                flex: 1,
                                backgroundColor: '#218aff',
                                borderRadius: Math.round(BUTTON_RADIUS * S),
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(33,138,255,0.3)',
                            }}
                        >
                            <span style={{ fontWeight: 'bold', color: 'white', fontSize: Math.round(14 * S) }}>
                                Ask Question
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* Capture / Ask toggle scaled to match */
function ModeToggle({ isAskMode, onToggle }: { isAskMode: boolean; onToggle: () => void }) {
    const trackW = Math.round(90 * S)   // 133
    const trackH = Math.round(24 * S)   // 33
    const r = 100 * S                   // 100 radius for perfect pill

    const slideWActive = Math.round(34 * S)    // ask side (refined width)
    const slideWInactive = Math.round(52 * S)  // capture side
    const slideLeftActive = Math.round(56 * S) // refined left position
    const slideLeftInactive = Math.round(-1 * S)
    const slideHeight = Math.round(22 * S)     // matched to track height exactly

    return (
        <div onClick={onToggle} style={{ display: 'inline-block', cursor: 'pointer' }}>
            <div
                style={{
                    position: 'relative',
                    width: trackW,
                    height: Math.round(22 * S),
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: r,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {/* Sliding indicator */}
                <div
                    style={{
                        position: 'absolute',
                        width: isAskMode ? slideWActive : slideWInactive,
                        height: slideHeight,
                        backgroundColor: '#218aff',
                        borderRadius: 100 * S,
                        top: 0,
                        left: isAskMode ? slideLeftActive : slideLeftInactive,
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                        transform: 'translateZ(0)',
                    }}
                />
                <span
                    style={{
                        position: 'absolute',
                        left: Math.round(7 * S),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isAskMode ? '#666666' : 'white',
                        fontSize: Math.round(10 * S),
                        fontWeight: 500,
                        zIndex: 2,
                        transition: 'color 0.3s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Capture
                </span>
                <span
                    style={{
                        position: 'absolute',
                        right: Math.round(7 * S),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isAskMode ? 'white' : '#666666',
                        fontSize: Math.round(10 * S),
                        fontWeight: 500,
                        zIndex: 2,
                        transition: 'color 0.3s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Ask
                </span>
            </div>
        </div>
    )
}

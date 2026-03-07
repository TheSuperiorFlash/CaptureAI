'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * Interactive replica of the extension's floating UI panel.
 * All dimensions are the original extension values × 1.48 to
 * match the exact extension proportions at a larger display size.
 * No CSS transform — every value is literal so height changes work correctly.
 */

// Scale factor applied to every pixel value from the original 250px panel
const S = 1.75

export default function FloatingUIShowcase() {
    const [isAskMode, setIsAskMode] = useState(false)

    return (
        <div
            style={{
                width: Math.round(250 * S),   // 370
                borderRadius: Math.round(10 * S),
                fontFamily: "'Inter', sans-serif",
                color: '#333333',
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
            }}
        >
            {/* ---- Header ---- */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${Math.round(10 * S)}px ${Math.round(15 * S)}px`,
                    justifyContent: 'space-between',
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
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
                    backgroundColor: 'white',
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
                        backgroundColor: 'white',
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
                            padding: Math.round(10 * S),
                            backgroundColor: '#218aff',
                            borderRadius: Math.round(8 * S),
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
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
                            padding: Math.round(10 * S),
                            backgroundColor: '#f1f1f1',
                            borderRadius: Math.round(8 * S),
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            border: '1px solid #d1d1d1',
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
                        backgroundColor: 'white',
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
                            padding: Math.round(10 * S),
                            border: '1px solid #e0e0e0',
                            borderRadius: Math.round(8 * S),
                            fontFamily: "'Inter', sans-serif",
                            fontSize: Math.round(14 * S),
                            color: '#333333',
                            backgroundColor: '#f0f0f0',
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
                                padding: Math.round(10 * S),
                                width: Math.round(40 * S),
                                backgroundColor: '#f1f1f1',
                                border: '1px solid #d1d1d1',
                                borderRadius: Math.round(8 * S),
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
                                padding: Math.round(10 * S),
                                flex: 1,
                                backgroundColor: '#218aff',
                                borderRadius: Math.round(8 * S),
                                cursor: 'pointer',
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
    const trackH = Math.round(22 * S)   // 33
    const r = Math.round(11 * S)        // 16

    const slideWActive = Math.round(34 * S)    // ask side — 34 base × 1.75 = ~60px display
    const slideWInactive = Math.round(52 * S)  // capture side
    const slideLeftActive = trackW - slideWActive - 1  // flush to right edge
    const slideLeftInactive = -1

    return (
        <div onClick={onToggle} style={{ display: 'inline-block', cursor: 'pointer' }}>
            <div
                style={{
                    position: 'relative',
                    width: trackW,
                    height: trackH,
                    backgroundColor: '#f0f0f0',
                    borderRadius: r,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                }}
            >
                {/* Sliding indicator */}
                <div
                    style={{
                        position: 'absolute',
                        width: isAskMode ? slideWActive : slideWInactive,
                        height: trackH,
                        backgroundColor: '#218aff',
                        borderRadius: r,
                        top: -1,
                        left: isAskMode ? slideLeftActive : slideLeftInactive,
                        transition: 'all 0.3s ease',
                        zIndex: 1,
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

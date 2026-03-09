'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, X as XIcon, ArrowRight, Shield, MessageSquare, Repeat, Infinity as InfinityIcon, Minus, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useSwipeTier } from '@/hooks/useSwipeTier'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const freeFeatures: Array<{ text: string; included: boolean; limited?: boolean }> = [
    { text: '10 requests per day', included: true, limited: true },
    { text: 'Screenshot capture', included: true },
    { text: 'Floating interface', included: true },
    { text: 'Stealth Mode', included: true },
    { text: 'Works on any website', included: true },
    { text: 'Privacy Guard', included: false },
    { text: 'Ask Mode', included: false },
    { text: 'Auto-Solve', included: false },
]

const proFeatures = [
    { text: 'Screenshot capture', included: true },
    { text: 'Floating interface', included: true },
    { text: 'Stealth Mode', included: true },
    { text: 'Works on any website', included: true },
]

const proHighlights = [
    { icon: InfinityIcon, title: 'Unlimited', desc: 'No daily caps' },
    { icon: Shield, title: 'Privacy Guard', desc: 'Stay undetected' },
    { icon: MessageSquare, title: 'Ask Mode', desc: 'Follow-up questions' },
    { icon: Repeat, title: 'Auto-Solve', desc: 'Hands-free answers' },
]

async function apiPost(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            mode: 'cors',
        })

        const contentType = response.headers.get('content-type')

        if (!response.ok) {
            let errorMessage = 'Request failed'
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.error || errorMessage
                } catch {
                    errorMessage = `Server error: ${response.status}`
                }
            } else {
                const errorText = await response.text()
                errorMessage = errorText || `Server error: ${response.status}`
            }
            throw new Error(errorMessage)
        }

        // Parse JSON only when content-type includes 'application/json'
        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        } else {
            // For non-JSON 2xx responses, return empty object or plain text
            const text = await response.text()
            return { response: text }
        }
    } catch (error) {
        // Only treat actual fetch-related TypeErrors as connectivity issues
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
            throw new Error('Unable to connect to server. Please check your internet connection.')
        }
        throw error
    }
}

export default function ActivatePage() {
    const [email, setEmail] = useState('')
    const { selectedTier, setSelectedTier, handleTouchStart, handleTouchEnd, handleTouchCancel } = useSwipeTier()

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        type: 'success' | 'error'
        message: string
        existing?: boolean
    } | null>(null)

    const handleSignup = async () => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            setResult({ type: 'error', message: 'Please enter your email address' })
            return
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setResult({ type: 'error', message: 'Please enter a valid email address' })
            return
        }

        setEmail(trimmedEmail)

        setLoading(true)
        setResult(null)

        try {
            if (selectedTier === 'free') {
                await handleFreeSignup()
            } else {
                await handleProSignup()
            }
        } catch (error) {
            setResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'An error occurred',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFreeSignup = async () => {
        const data = await apiPost(`${API_BASE_URL}/api/auth/create-free-key`, { email })

        // Validate data.existing with runtime type guard
        const existingValue = typeof data.existing === 'boolean' ? data.existing : undefined

        setResult({
            type: 'success',
            message: existingValue
                ? `We've sent your existing license key to ${email}`
                : `Your license key has been sent to ${email}`,
            existing: existingValue,
        })
    }

    const handleProSignup = async () => {
        const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email })

        if (data.url) {
            // Validate redirect URL points to a trusted domain (Stripe checkout)
            const url = new URL(data.url as string)
            if (url.protocol !== 'https:') {
                throw new Error('Unexpected checkout URL protocol')
            }
            const trustedHosts = ['checkout.stripe.com', 'billing.stripe.com']
            if (!trustedHosts.includes(url.hostname)) {
                throw new Error('Unexpected checkout URL')
            }
            window.location.href = url.href
        } else {
            throw new Error('No checkout URL received')
        }
    }

    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />
            <div className="absolute right-[-100px] top-[40%] h-[300px] w-[300px] rounded-full bg-cyan-500 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-5xl px-6">
                {/* Header */}
                <div className="mx-auto mb-14 max-w-xl text-center">
                    <div className="mb-5 flex justify-center">
                        <Image src="/logo.svg" alt="CaptureAI" width={48} height={48} />
                    </div>
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Choose your </span>
                        <span className="text-gradient-static">plan</span>
                    </h1>
                    <p className="text-[--color-text-secondary]">
                        Start free with 10 requests per day, or unlock everything with Pro.
                    </p>
                </div>

                {/* Plans grid */}
                <div
                    className="mx-auto grid grid-cols-1 w-full max-w-4xl md:gap-6 md:grid-cols-2 perspective-[1200px]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                >
                    {/* Free plan */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'free'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative glass-card cursor-pointer rounded-2xl p-7 transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center flex flex-col ${selectedTier === 'free'
                            ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.08)] z-20 translate-x-0 scale-100 rotate-0 opacity-100'
                            : 'z-10 -translate-x-12 sm:-translate-x-16 scale-[0.85] -rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('free')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('free'); } }}
                    >
                        <div className="absolute right-6 top-6">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${selectedTier === 'free'
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-white/20'
                                }`}>
                                {selectedTier === 'free' && <Check className="h-4 w-4 text-white" />}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-[--color-text]">Free</h2>
                            <p className="text-sm text-[--color-text-tertiary]">For trying it out</p>
                        </div>

                        <div className="mb-7">
                            <span className="text-4xl font-extrabold font-inter text-[--color-text]">$0</span>
                            <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                        </div>

                        <ul className="space-y-3">
                            {freeFeatures.map((f) => (
                                <li key={f.text} className={`flex items-center gap-3 ${!f.included ? 'opacity-30' : ''}`}>
                                    {f.limited ? (
                                        <Minus className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" aria-hidden="true" />
                                    ) : f.included ? (
                                        <Check className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                    ) : (
                                        <XIcon className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                    )}
                                    <span className="text-sm text-[--color-text-secondary]">{f.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro plan */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'pro'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative cursor-pointer rounded-[24px] glow-blue border transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === 'pro'
                            ? 'shadow-[0_0_40px_rgba(0,240,255,0.25)] border-cyan-400/50 md:-translate-y-1 z-20 translate-x-0 scale-100 rotate-0 opacity-100'
                            : 'border-cyan-500/20 md:hover:-translate-y-1 md:hover:border-cyan-400/50 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)] z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('pro')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('pro'); } }}
                    >
                        <div className="relative rounded-[23px] bg-gradient-to-b from-[#0a1128] to-[#040715] p-7 h-full w-full">
                            <div className="absolute right-6 top-6">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${selectedTier === 'pro'
                                    ? 'border-cyan-400 bg-cyan-400'
                                    : 'border-white/20'
                                    }`}>
                                    {selectedTier === 'pro' && <Check className="h-4 w-4 text-[--color-background]" />}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[--color-text]">Pro</h2>
                                <p className="text-sm text-[--color-text-tertiary] mt-1">For daily use</p>
                            </div>

                            <div className="mb-7">
                                <span className="text-4xl font-extrabold font-inter text-gradient-static">$9.99</span>
                                <span className="text-sm text-[--color-text-tertiary]"> / month</span>
                            </div>

                            {/* Pro highlights grid */}
                            <div className="mb-7 grid grid-cols-2 gap-2.5">
                                {proHighlights.map((h) => {
                                    const Icon = h.icon
                                    return (
                                        <div key={h.title} className="rounded-xl bg-white/[0.03] p-3">
                                            <Icon className="mb-1.5 h-4 w-4 text-cyan-400" />
                                            <div className="text-xs font-medium text-[--color-text]">{h.title}</div>
                                            <div className="text-[11px] text-[--color-text-tertiary]">{h.desc}</div>
                                        </div>
                                    )
                                })}
                            </div>

                            <ul className="space-y-3">
                                {proFeatures.map((f) => (
                                    <li key={f.text} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                                        <span className="text-sm text-[--color-text-secondary]">{f.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Email + CTA section */}
                <div className="mx-auto mt-12 max-w-2xl">
                    <div className="glass-card rounded-2xl p-8 md:p-10">
                        <h3 className="mb-2 text-center text-xl font-semibold text-[--color-text]">
                            {selectedTier === 'free' ? 'Get your free license key' : 'Start your Pro subscription'}
                        </h3>
                        <p className="mb-8 text-center text-[15px] text-[--color-text-tertiary]">
                            {selectedTier === 'free'
                                ? 'Enter your email and we\'ll send you a key instantly.'
                                : 'Enter your email to proceed to secure checkout via Stripe.'}
                        </p>

                        <div className="mx-auto max-w-lg mb-4 flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !loading) {
                                        e.preventDefault()
                                        handleSignup()
                                    }
                                }}
                                placeholder="your@email.com"
                                aria-label="Email address"
                                autoComplete="email"
                                className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 text-base text-[--color-text] placeholder:text-[--color-text-tertiary] focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleSignup}
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all ${loading
                                    ? 'cursor-not-allowed bg-blue-600/40'
                                    : 'glow-btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.02]'
                                    }`}
                            >
                                {loading ? (
                                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" role="status" aria-label="Loading" />
                                ) : (
                                    <>
                                        {selectedTier === 'free' ? 'Get Key' : 'Continue'}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>


                        {/* Result message */}
                        {result && (
                            <div
                                role="status"
                                aria-live="polite"
                                aria-atomic="true"
                                className={`mt-5 rounded-xl border p-5 ${result.type === 'success'
                                    ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                                    : 'border-red-500/20 bg-red-500/[0.05]'
                                    }`}
                            >
                                {result.type === 'success' ? (
                                    <>
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                                                <Check className="h-3 w-3 text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-emerald-400">
                                                {result.existing ? 'Welcome back!' : 'Check your email'}
                                            </h3>
                                        </div>
                                        <p className="mb-3 text-sm text-[--color-text-tertiary]">
                                            {result.message}
                                        </p>
                                        <div className="text-sm text-[--color-text-tertiary]">
                                            <p className="mb-1 font-medium text-[--color-text-secondary]">Next steps:</p>
                                            <ol className="list-inside list-decimal space-y-0.5">
                                                <li>Check your inbox (and spam folder)</li>
                                                <li>Copy the license key</li>
                                                <li>Open the CaptureAI extension popup</li>
                                                <li>Paste and activate</li>
                                            </ol>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <h3 className="mb-1.5 text-sm font-semibold text-red-400">Something went wrong</h3>
                                        <p className="text-sm text-red-200/70">{result.message}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-[--color-text-tertiary]">
                        Already have a key? Open the CaptureAI extension popup to activate it.
                    </p>
                </div>
            </div>
        </div >
    )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'

export default function ActivatePage() {
    const [email, setEmail] = useState('')
    const [selectedTier, setSelectedTier] = useState<'free' | 'pro'>('free')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        type: 'success' | 'error'
        message: string
        existing?: boolean
    } | null>(null)

    const handleSignup = async () => {
        if (!email) {
            setResult({ type: 'error', message: 'Please enter your email address' })
            return
        }

        if (!email.includes('@') || !email.includes('.')) {
            setResult({ type: 'error', message: 'Please enter a valid email address' })
            return
        }

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
        try {
            const response = await fetch('https://api.captureai.workers.dev/api/auth/create-free-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                mode: 'cors',
            })

            if (!response.ok) {
                const errorText = await response.text()
                let errorMessage = 'Failed to create license key'
                try {
                    const errorData = JSON.parse(errorText)
                    errorMessage = errorData.error || errorMessage
                } catch {
                    errorMessage = errorText || errorMessage
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()

            setResult({
                type: 'success',
                message: data.existing
                    ? `We've sent your existing license key to ${email}`
                    : `Your license key has been sent to ${email}`,
                existing: data.existing,
            })
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection.')
            }
            throw error
        }
    }

    const handleProSignup = async () => {
        try {
            const response = await fetch('https://api.captureai.workers.dev/api/subscription/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                mode: 'cors',
            })

            if (!response.ok) {
                const errorText = await response.text()
                let errorMessage = 'Failed to start checkout'
                try {
                    const errorData = JSON.parse(errorText)
                    errorMessage = errorData.error || errorMessage
                } catch {
                    errorMessage = errorText || errorMessage
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL received')
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your internet connection.')
            }
            throw error
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center px-6 py-20">
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-1/2 top-[20%] h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur animate-pulse-glow" />

            <div className="relative z-10 w-full max-w-md">
                <div className="gradient-border rounded-2xl">
                    <div className="rounded-2xl bg-gradient-to-b from-[--color-surface]/80 to-[--color-background]/90 p-8 backdrop-blur-xl">
                        {/* Logo + header */}
                        <div className="mb-8 text-center">
                            <div className="mb-4 flex justify-center">
                                <Image src="/icon128.png" alt="CaptureAI" width={48} height={48} />
                            </div>
                            <h1 className="mb-1 text-2xl font-bold text-[--color-text]">Get started</h1>
                            <p className="text-sm text-[--color-text-tertiary]">
                                Choose a plan and enter your email to receive a license key.
                            </p>
                        </div>

                        {/* Tier selection */}
                        <div className="mb-6 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedTier('free')}
                                className={`rounded-xl border p-4 text-left transition-all ${
                                    selectedTier === 'free'
                                        ? 'border-blue-500/40 bg-blue-500/[0.06] shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                                        : 'border-white/[0.06] hover:border-white/[0.1]'
                                }`}
                            >
                                <div className="mb-1 text-sm font-medium text-[--color-text]">Free</div>
                                <div className="mb-2 text-xl font-bold text-[--color-text]">$0</div>
                                <div className="text-xs text-[--color-text-tertiary]">10 requests/day</div>
                            </button>

                            <button
                                onClick={() => setSelectedTier('pro')}
                                className={`rounded-xl border p-4 text-left transition-all ${
                                    selectedTier === 'pro'
                                        ? 'border-cyan-500/40 bg-cyan-500/[0.06] shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                                        : 'border-white/[0.06] hover:border-white/[0.1]'
                                }`}
                            >
                                <div className="mb-1 text-sm font-medium text-[--color-text]">Pro</div>
                                <div className="mb-2 text-xl font-bold text-gradient-static">$9.99<span className="text-xs font-normal text-[--color-text-tertiary]">/mo</span></div>
                                <div className="text-xs text-[--color-text-tertiary]">Unlimited + all features</div>
                            </button>
                        </div>

                        {/* Email input */}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                            placeholder="you@email.com"
                            autoComplete="email"
                            className="mb-4 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-[--color-text] placeholder:text-[--color-text-tertiary] focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />

                        {/* Submit button */}
                        <button
                            onClick={handleSignup}
                            disabled={loading}
                            className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-all ${
                                loading
                                    ? 'cursor-not-allowed bg-blue-600/40'
                                    : 'glow-btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500'
                            }`}
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Processing...
                                </span>
                            ) : selectedTier === 'free' ? (
                                'Get Free License Key'
                            ) : (
                                'Continue to Checkout'
                            )}
                        </button>

                        {/* Result message */}
                        {result && (
                            <div
                                className={`mt-5 rounded-xl border p-5 ${
                                    result.type === 'success'
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
                                    <>
                                        <h3 className="mb-1 text-sm font-semibold text-red-400">Error</h3>
                                        <p className="text-sm text-[--color-text-tertiary]">{result.message}</p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Footer note */}
                        <div className="mt-6 border-t border-white/[0.04] pt-5 text-center text-xs text-[--color-text-tertiary]">
                            Already have a key? Open the CaptureAI extension popup to activate it.
                        </div>
                    </div>
                </div>

                {/* Help link */}
                <p className="mt-5 text-center text-xs text-[--color-text-tertiary]">
                    Need help?{' '}
                    <a
                        href="https://github.com/TheSuperiorFlash/CaptureAI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline underline-offset-2"
                    >
                        Visit GitHub
                    </a>
                </p>
            </div>
        </div>
    )
}

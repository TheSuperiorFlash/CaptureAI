'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Check, X, ArrowRight, Mail, Zap } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'

const MAX_RETRIES = 5
const INITIAL_DELAY_MS = 1000

function PaymentSuccessContent() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const verifyPayment = async (attempt: number): Promise<void> => {
            const sessionId = searchParams.get('session_id')

            if (!sessionId) {
                setStatus('error')
                setErrorMessage('No payment session found.')
                return
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/subscription/verify-payment`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    }
                )

                const contentType = response.headers.get('content-type')

                if (!response.ok) {
                    let errorMsg: string
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json()
                        errorMsg = data.error || 'Payment verification failed'
                    } else {
                        errorMsg = `Server error: ${response.status} ${response.statusText}`
                    }

                    const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600)

                    if (shouldRetry && attempt < MAX_RETRIES) {
                        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
                        await new Promise(resolve => setTimeout(resolve, delay))
                        return verifyPayment(attempt + 1)
                    }

                    throw new Error(errorMsg)
                }

                if (contentType && contentType.includes('application/json')) {
                    await response.json()
                }

                setStatus('success')
            } catch (error) {
                // Only retry on network/timeout errors, not on 4xx client errors
                const isRetryable = !(error instanceof Error && (
                    error.message.includes('No payment session') ||
                    error.message.includes('Payment verification failed') ||
                    error.message.includes('Invalid session')
                ));
                if (isRetryable && attempt < MAX_RETRIES) {
                    const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    return verifyPayment(attempt + 1)
                }

                setStatus('error')
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Payment verification failed. If you completed payment, please check your email for your license key.'
                )
            }
        }

        verifyPayment(0)
    }, [searchParams])

    return (
        <div className="relative overflow-x-hidden py-20 md:py-28">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 gradient-mesh" />
            <div className="absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />
            <div className="absolute right-[-100px] top-[40%] h-[300px] w-[300px] rounded-full bg-cyan-500 gradient-blur" />

            <div className="relative z-10 mx-auto max-w-lg px-6">
                {/* Logo */}
                <div className="mb-10 flex justify-center">
                    <Image src="/icon128.png" alt="CaptureAI" width={48} height={48} />
                </div>

                {/* Loading */}
                {status === 'loading' && (
                    <div className="glass-card rounded-2xl p-10 text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[--color-accent]" />
                        </div>
                        <h1 className="mb-2 text-xl font-bold text-[--color-text]">Verifying payment</h1>
                        <p className="text-sm text-[--color-text-tertiary]">Just a moment while we confirm your order…</p>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div className="gradient-border rounded-2xl">
                        <div className="rounded-2xl bg-gradient-to-b from-blue-500/[0.06] to-cyan-500/[0.02] p-8 text-center">
                            {/* Badge */}
                            <div className="mb-6 flex justify-center">
                                <span className="rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                                    PRO
                                </span>
                            </div>

                            {/* Icon */}
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                                <Check className="h-7 w-7 text-emerald-400" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-[--color-text]">You&apos;re now Pro</h1>
                            <p className="mb-8 text-sm text-[--color-text-tertiary]">
                                Your Pro license key is on its way to your inbox.
                            </p>

                            {/* Steps */}
                            <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[--color-text-tertiary]">Next steps</p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold text-[--color-text-tertiary]">1</div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                            <span className="text-sm text-[--color-text-secondary]">Check your email for the Pro license key</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold text-[--color-text-tertiary]">2</div>
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                            <span className="text-sm text-[--color-text-secondary]">Open the CaptureAI extension and paste the key</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-xs font-bold text-[--color-text-tertiary]">3</div>
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 flex-shrink-0 text-[--color-text-tertiary]" />
                                            <span className="text-sm text-[--color-text-secondary]">Activate and enjoy unlimited access</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/activate"
                                className="glow-btn flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                            >
                                Go to Activation
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="glass-card rounded-2xl p-8 text-center">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                            <X className="h-7 w-7 text-red-400" />
                        </div>

                        <h1 className="mb-2 text-2xl font-bold text-[--color-text]">Verification failed</h1>
                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
                            We couldn&apos;t verify your payment.
                        </p>

                        {errorMessage && (
                            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-[--color-text-tertiary]">
                                {errorMessage}
                            </div>
                        )}

                        <p className="mb-6 text-sm text-[--color-text-tertiary]">
                            If your payment went through, check your email for the license key — it may have been sent already.
                        </p>

                        <Link
                            href="/activate"
                            className="block rounded-xl border border-white/[0.08] py-3 text-sm font-medium text-[--color-text-secondary] transition-colors hover:border-white/[0.15] hover:text-[--color-text]"
                        >
                            Return to Activation
                        </Link>
                    </div>
                )}

                <p className="mt-6 text-center text-xs text-[--color-text-tertiary]">
                    Questions?{' '}
                    <Link href="/contact" className="text-[--color-accent-hover] hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[--color-accent]" />
                </div>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    )
}

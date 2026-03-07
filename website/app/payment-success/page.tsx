'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
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
                setErrorMessage('No payment session found')
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

                    // Only retry on transient errors: 429 or 5xx
                    const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600)

                    if (shouldRetry && attempt < MAX_RETRIES) {
                        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
                        await new Promise(resolve => setTimeout(resolve, delay))
                        return verifyPayment(attempt + 1)
                    }

                    // For 4xx client errors (except 429), throw immediately without retry
                    throw new Error(errorMsg)
                }

                if (contentType && contentType.includes('application/json')) {
                    await response.json()
                }

                setStatus('success')
            } catch (error) {
                if (attempt < MAX_RETRIES && !(error instanceof Error && error.message.includes('No payment session'))) {
                    const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
                    await new Promise(resolve => setTimeout(resolve, delay))
                    return verifyPayment(attempt + 1)
                }

                console.error('Payment verification error:', error)
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
        <section className="relative flex min-h-screen items-center justify-center overflow-x-clip px-6 py-24 md:py-32">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute inset-0 aurora-bg opacity-40" />
                <div className="absolute left-[50%] top-[50%] h-[600px] w-[600px] -translate-x-[50%] -translate-y-[50%] rounded-full bg-[#0047ff] gradient-blur opacity-20" />
                <div className="absolute left-[50%] top-[50%] h-[400px] w-[400px] -translate-x-[50%] -translate-y-[50%] rounded-full bg-[#00f0ff] gradient-blur opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-md reveal-up">
                <div className="glass-card rounded-3xl p-8 text-center sm:p-10">
                    {/* Loading */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center gap-5 py-12">
                            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/[0.1] border-t-cyan-400" />
                            <span className="text-[15px] font-medium text-[--color-text-secondary]">Verifying your payment...</span>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                                <Check className="h-8 w-8 text-cyan-400" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-[--color-text] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Payment successful</h1>
                            <p className="mb-8 text-[15px] text-[--color-text-tertiary]">
                                Check your email for your Pro license key.
                            </p>

                            <div className="mb-8 text-left rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                                        </span>
                                        <span className="text-[11px] font-bold tracking-widest text-cyan-400">PRO UNLOCKED</span>
                                    </div>

                                    <p className="mb-3 text-sm font-semibold text-[--color-text-secondary]">Next steps:</p>
                                    <ol className="list-decimal pl-4 space-y-2 text-sm text-[--color-text-tertiary] marker:text-cyan-600/50">
                                        <li>Check your email for the license key</li>
                                        <li>Open the CaptureAI extension popup</li>
                                        <li>Enter your key to activate Pro</li>
                                    </ol>
                                </div>
                            </div>

                            <Link
                                href="/activate"
                                className="glow-btn block rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-[15px] font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500"
                            >
                                Return to Activation
                            </Link>
                        </>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <X className="h-8 w-8 text-red-400" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-[--color-text]">Verification failed</h1>
                            <p className="mb-6 text-[15px] text-[--color-text-tertiary]">
                                We couldn&apos;t verify your payment.
                            </p>

                            <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-[14px] leading-relaxed text-[--color-text-secondary]">
                                {errorMessage}
                            </div>

                            <Link
                                href="/activate"
                                className="block rounded-xl border border-white/[0.08] bg-white/[0.02] py-3.5 text-[15px] font-medium text-[--color-text-secondary] transition-all hover:bg-white/[0.05] hover:text-[--color-text] hover:border-white/[0.12]"
                            >
                                Return to Activation
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <section className="relative flex min-h-screen items-center justify-center overflow-x-clip px-6 py-24 md:py-32">
                    <div className="pointer-events-none absolute inset-0 z-0">
                        <div className="absolute inset-0 aurora-bg opacity-40" />
                    </div>
                    <span className="relative z-10 inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/[0.1] border-t-cyan-400" />
                </section>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    )
}

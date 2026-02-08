'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.captureai.workers.dev'

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

                    if (attempt < MAX_RETRIES) {
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
        <div className="flex min-h-screen items-center justify-center px-6 py-20">
            <div className="w-full max-w-md">
                <div className="rounded-xl border border-[--color-border] p-8 text-center">
                    {/* Loading */}
                    {status === 'loading' && (
                        <div className="flex items-center justify-center gap-3 py-8 text-[--color-text-secondary]">
                            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
                            <span className="text-sm">Verifying your payment...</span>
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                                <Check className="h-6 w-6 text-green-400" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-[--color-text]">Payment successful</h1>
                            <p className="mb-6 text-sm text-[--color-text-tertiary]">
                                Check your email for your Pro license key.
                            </p>

                            <div className="mb-6 inline-flex rounded-md bg-[--color-accent-muted] px-3 py-1 text-xs font-semibold text-[--color-accent-hover]">
                                PRO
                            </div>

                            <div className="mb-6 rounded-lg border border-[--color-border-subtle] p-5 text-left">
                                <p className="mb-3 text-sm font-medium text-[--color-text-secondary]">Next steps:</p>
                                <ol className="list-inside list-decimal space-y-1.5 text-sm text-[--color-text-tertiary]">
                                    <li>Check your email for the Pro license key</li>
                                    <li>Open the CaptureAI extension popup</li>
                                    <li>Enter your license key to activate Pro</li>
                                </ol>
                            </div>

                            <Link
                                href="/activate"
                                className="block rounded-lg bg-[--color-accent] py-3 text-sm font-medium text-white transition-colors hover:bg-[--color-accent-hover]"
                            >
                                Return to Activation
                            </Link>
                        </>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                <X className="h-6 w-6 text-red-400" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-[--color-text]">Verification failed</h1>
                            <p className="mb-6 text-sm text-[--color-text-tertiary]">
                                We couldn&apos;t verify your payment.
                            </p>

                            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-[--color-text-tertiary]">
                                {errorMessage}
                            </div>

                            <Link
                                href="/activate"
                                className="block rounded-lg border border-[--color-border] py-3 text-sm font-medium text-[--color-text-secondary] transition-colors hover:border-[--color-text-tertiary] hover:text-[--color-text]"
                            >
                                Return to Activation
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
                </div>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    )
}

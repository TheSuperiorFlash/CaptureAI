'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { flushSync } from 'react-dom'
import { Check, X as XIcon, ArrowRight, Shield, MessageSquare, Repeat, Infinity as InfinityIcon, Minus, AlertCircle, Mail } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useSwipeTier } from '@/hooks/useSwipeTier'
import { SparklesCore } from '@/components/ui/sparkles'
import { trackEvent } from '@/lib/analytics'
import { Tab } from '@/components/ui/pricing-tab'
import { AnimatedPrice } from '@/components/ui/animated-price'

const PRICES = {
    basic: { weekly: 1.99, monthly: 5.99 },
    pro: { weekly: 3.49, monthly: 9.99 },
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const basicFeatures: Array<{ text: string; included: boolean; limited?: boolean }> = [
    { text: '50 requests per day', included: true, limited: true },
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
            const fetchErr = new Error(errorMessage) as Error & { status: number }
            fetchErr.status = response.status
            throw fetchErr
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

interface AppError extends Error {
    status?: number
}

interface ResultState {
    message: string
    type?: 'error' | 'info'
}

interface ConfirmationData {
    tier: string
    billingPeriod: 'weekly' | 'monthly'
    email: string
}

function UpgradeConfirmModal({ data, visible, loading, onConfirm, onCancel }: {
    data: ConfirmationData
    visible: boolean
    loading: boolean
    onConfirm: (verificationCode: string) => void
    onCancel: () => void
}) {
    const [verificationCode, setVerificationCode] = useState('')
    const [codeSent, setCodeSent] = useState(false)
    const [codeSending, setCodeSending] = useState(false)
    const [codeError, setCodeError] = useState<string | null>(null)
    const [resendCooldown, setResendCooldown] = useState(0)

    const sendCode = async () => {
        setCodeSending(true)
        setCodeError(null)
        try {
            await apiPost(`${API_BASE_URL}/api/subscription/send-verification`, {
                email: data.email,
                tier: data.tier,
                billingPeriod: data.billingPeriod,
            })
            setCodeSent(true)
            setResendCooldown(60)
        } catch (error) {
            setCodeError(error instanceof Error ? error.message : 'Failed to send code')
        } finally {
            setCodeSending(false)
        }
    }

    // Auto-send verification code when modal opens
    useEffect(() => {
        if (visible && !codeSent && !codeSending) {
            sendCode()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible])

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
        return () => clearTimeout(timer)
    }, [resendCooldown])

    const handleCodeInput = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 6)
        setVerificationCode(digits)
        setCodeError(null)
    }

    const canConfirm = verificationCode.length === 6 && !loading

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />
            <div className={`relative w-full max-w-sm transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}>
                <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative rounded-[28px] border border-cyan-400/25 bg-gradient-to-b from-[#09112a] to-[#040810] p-8 shadow-[0_0_80px_rgba(0,240,255,0.10),0_40px_80px_rgba(0,0,0,0.7)]">
                    <button type="button" onClick={onCancel}
                        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                        aria-label="Cancel">
                        <XIcon className="h-4 w-4" />
                    </button>

                    <div className="mb-6 flex justify-center">
                        <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-1.5">
                            <Mail className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Verify your identity</span>
                        </div>
                    </div>

                    <p className="mb-1 text-center text-base font-semibold text-[--color-text]">Check your email</p>
                    <p className="mb-6 text-center text-sm text-[--color-text-tertiary]">
                        {codeSent ? `We sent a code to ${data.email}` : 'Sending verification code...'}
                    </p>

                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => handleCodeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && canConfirm) onConfirm(verificationCode) }}
                        maxLength={6}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-[--color-text] placeholder:text-[--color-text-tertiary] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/15 transition-all"
                    />
                    {codeError && (
                        <p className="mt-2 text-center text-xs text-red-400">{codeError}</p>
                    )}
                    <div className="mt-3 mb-4 flex justify-center">
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={codeSending || resendCooldown > 0}
                            className="text-xs text-[--color-text-tertiary] transition-colors hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {codeSending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                        </button>
                    </div>

                    <button type="button" onClick={() => onConfirm(verificationCode)} disabled={!canConfirm}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white transition-all ${!canConfirm ? 'cursor-not-allowed bg-blue-600/40' : 'glow-btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.01]'
                            }`}>
                        {loading
                            ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" role="status" aria-label="Loading" />
                            : 'Continue to payment'
                        }
                    </button>

                    <button type="button" onClick={onCancel}
                        className="mt-4 w-full text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

const ActivateSparkles = memo(function ActivateSparkles() {
    return (
        <div className="pointer-events-none absolute inset-0 h-full w-full">
            <SparklesCore
                id="activate-sparkles"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={15}
                className="h-full w-full"
                particleColor="#FFFFFF"
                speed={0.5}
            />
        </div>
    )
})

export default function ActivatePage() {
    const [email, setEmail] = useState('')
    const { selectedTier, setSelectedTier, handleTouchStart, handleTouchEnd, handleTouchCancel } = useSwipeTier()
    const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly'>('monthly')
    const direction = (billingPeriod === 'monthly' ? 1 : -1) as 1 | -1
    const [isTrial, setIsTrial] = useState(false)
    const [isBasicHiding, setIsBasicHiding] = useState(false)
    const [isTrialContentVisible, setIsTrialContentVisible] = useState(false)
    const proCardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isTrial) {
            const id = requestAnimationFrame(() => setIsTrialContentVisible(true))
            return () => cancelAnimationFrame(id)
        } else {
            setIsTrialContentVisible(false)
        }
    }, [isTrial])

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ResultState | null>(null)
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false)

    // Read tier, billing period, and trial flag from URL params (set by Pricing page links)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const tierParam = params.get('tier')
        const billingParam = params.get('billing')
        const trialParam = params.get('trial')
        if (tierParam === 'basic' || tierParam === 'pro') {
            setSelectedTier(tierParam)
        }
        if (billingParam === 'weekly' || billingParam === 'monthly') {
            setBillingPeriod(billingParam)
        }
        if (trialParam === 'true') {
            setIsTrial(true)
            setSelectedTier('pro')
            if (!billingParam) setBillingPeriod('weekly')
        }
    }, [setSelectedTier])

    useEffect(() => {
        if (confirmationData) {
            const id = requestAnimationFrame(() => setModalVisible(true))
            return () => cancelAnimationFrame(id)
        } else {
            setModalVisible(false)
        }
    }, [confirmationData])

    const flipCard = (applyChange: () => void) => {
        const card = proCardRef.current
        const before = card?.getBoundingClientRect()
        // flushSync ensures React updates the DOM synchronously before we measure
        flushSync(() => { applyChange() })
        if (!card || !before) return
        const after = card.getBoundingClientRect()
        const deltaX = before.left - after.left
        if (deltaX === 0) return
        card.style.transition = 'none'
        card.style.transform = `translateX(${deltaX}px)`
        card.getBoundingClientRect() // force reflow
        card.style.transition = 'transform 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        card.style.transform = 'translateX(0)'
        const cleanup = () => { card.style.transition = ''; card.style.transform = '' }
        card.addEventListener('transitionend', cleanup, { once: true })
    }

    const enterTrialMode = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setIsBasicHiding(true)
        setSelectedTier('pro')
        setBillingPeriod('weekly')
        setTimeout(() => {
            flipCard(() => { setIsTrial(true); setIsBasicHiding(false) })
        }, 350)
    }

    const exitTrialMode = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        flipCard(() => setIsTrial(false))
    }

    const handleSignup = async () => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            setResult({ message: 'Please enter your email address' })
            return
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setResult({ message: 'Please enter a valid email address' })
            return
        }

        setEmail(trimmedEmail)

        setLoading(true)
        setResult(null)

        try {
            if (selectedTier === 'basic') {
                await handleBasicSignup()
            } else {
                await handleProSignup()
            }
        } catch (error) {
            const appError = error as AppError
            setResult({
                message: appError instanceof Error ? appError.message : 'An error occurred',
                type: appError.status === 409 ? 'info' : 'error',
            })
        } finally {
            setLoading(false)
        }
    }

    const showConfirmModal = (data: ConfirmationData) => setConfirmationData(data)
    const hideConfirmModal = () => {
        setModalVisible(false)
        setTimeout(() => setConfirmationData(null), 300)
    }

    const handleConfirmUpgrade = async (verificationCode: string) => {
        if (!confirmationData) return
        setConfirmLoading(true)
        try {
            const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, {
                email: confirmationData.email,
                tier: confirmationData.tier,
                billingPeriod: confirmationData.billingPeriod,
                confirmed: true,
                verificationCode,
            })
            if (data.url) {
                redirectToCheckout(data.url as string)
            } else {
                throw new Error('No checkout URL received')
            }
        } catch (error) {
            hideConfirmModal()
            setResult({ message: error instanceof Error ? error.message : 'An error occurred' })
        } finally {
            setConfirmLoading(false)
        }
    }

    const redirectToCheckout = (rawUrl: string) => {
        const url = new URL(rawUrl)
        if (url.protocol !== 'https:') {
            throw new Error('Unexpected checkout URL protocol')
        }
        const trustedHosts = ['checkout.stripe.com', 'billing.stripe.com', 'invoice.stripe.com']
        if (!trustedHosts.includes(url.hostname) && url.hostname !== window.location.hostname) {
            throw new Error('Unexpected checkout URL')
        }
        window.location.href = url.href
    }

    const handleBasicSignup = async () => {
        const price = PRICES.basic[billingPeriod]
        trackEvent('click_checkout', { tier: 'basic', billingPeriod, value: price, currency: 'USD' })
        const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email, tier: 'basic', billingPeriod })
        if (data.requiresConfirmation) {
            showConfirmModal({ tier: data.tier as string, billingPeriod: (data.billingPeriod as 'weekly' | 'monthly') ?? billingPeriod, email })
            return
        }
        if (data.url) { redirectToCheckout(data.url as string) } else { throw new Error('No checkout URL received') }
    }

    const handleProSignup = async () => {
        const price = isTrial ? (billingPeriod === 'monthly' ? 2.99 : 0.99) : PRICES.pro[billingPeriod]
        trackEvent('click_checkout', { tier: 'pro', billingPeriod, value: price, currency: 'USD', trial: isTrial })
        const body: Record<string, unknown> = { email, tier: 'pro', billingPeriod }
        if (isTrial) body.trial = true
        const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, body)
        if (data.requiresConfirmation) {
            showConfirmModal({ tier: data.tier as string, billingPeriod: (data.billingPeriod as 'weekly' | 'monthly') ?? billingPeriod, email })
            return
        }
        if (data.url) { redirectToCheckout(data.url as string) } else { throw new Error('No checkout URL received') }
    }

    return (
        <>
            <div className="relative overflow-x-hidden py-20 md:py-28">
                {/* Background */}
                <div className="pointer-events-none absolute inset-0 gradient-mesh" />
                <div className="absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />
                <div className="absolute right-[-100px] top-[40%] h-[300px] w-[300px] rounded-full bg-cyan-500 gradient-blur" />
                {/* Sparkles particle background */}
                <ActivateSparkles />

                <div className="relative z-10 mx-auto max-w-5xl px-6">
                    {/* Header */}
                    <div className="mx-auto mb-8 max-w-xl text-center">
                        {isTrial ? (
                            <>
                                <h1 className="mb-3">
                                    <span className="text-[--color-text]">Start your </span>
                                    <span className="text-gradient-static">Pro trial</span>
                                </h1>
                                <p className="text-[--color-text-secondary]">
                                    $0.99 for 7 days or $2.99 for 30 days of unlimited access
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="mb-3">
                                    <span className="text-[--color-text]">Choose your </span>
                                    <span className="text-gradient-static">plan</span>
                                </h1>
                                <p className="text-[--color-text-secondary]">
                                    Start basic for 50 requests per day, or unlock everything with Pro.
                                </p>
                            </>
                        )}

                        {/* Billing period toggle */}
                        <div className="flex justify-center mt-6">
                            <div className="flex w-fit rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.08]">
                                {(['weekly', 'monthly'] as const).map((period) => (
                                    <Tab
                                        key={period}
                                        text={period}
                                        selected={billingPeriod === period}
                                        setSelected={(v) => setBillingPeriod(v as 'weekly' | 'monthly')}
                                        discount={period === 'monthly'}
                                        discountLabel="Save 30%"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* Plans grid */}
                    <div
                        className={`mx-auto grid grid-cols-1 w-full perspective-[1200px] ${isTrial ? 'max-w-md' : 'max-w-4xl md:gap-6 md:grid-cols-2'}`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                    >
                        {/* Basic plan — hidden in trial mode */}
                        {(!isTrial || isBasicHiding) && (
                        <div className={`row-start-1 col-start-1 md:row-auto md:col-auto transition-all duration-300 ease-in-out ${isBasicHiding ? 'opacity-0 -translate-x-3 pointer-events-none' : 'opacity-100'}`}>
                        <div
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedTier === 'basic'}
                            className={`relative glass-card cursor-pointer rounded-2xl p-7 transition-all duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none mx-auto h-full flex flex-col ${selectedTier === 'basic'
                                ? '!border-blue-500/30 !shadow-[0_0_30px_rgba(59,130,246,0.08)] z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:hover:-translate-y-1'
                                : 'z-10 -translate-x-12 sm:-translate-x-16 scale-[0.85] -rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100 md:border-transparent md:shadow-none md:hover:-translate-y-1 md:hover:!border-blue-500/30 md:hover:!shadow-[0_0_30px_rgba(59,130,246,0.08)]'
                                }`}
                            onClick={() => setSelectedTier('basic')}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('basic'); } }}
                        >
                            <div className="absolute right-6 top-6">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${selectedTier === 'basic'
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-white/20'
                                    }`}>
                                    {selectedTier === 'basic' && <Check className="h-4 w-4 text-white" />}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[--color-text]">Basic</h2>
                                <p className="text-sm text-[--color-text-tertiary]">For trying it out</p>
                            </div>

                            <div className="mb-7">
                                <AnimatedPrice
                                    price={PRICES.basic[billingPeriod]}
                                    period={billingPeriod === 'monthly' ? 'mo' : 'wk'}
                                    direction={direction}
                                    priceClassName="text-4xl font-extrabold font-inter text-[--color-text]"
                                    periodClassName="text-sm text-[--color-text-tertiary] ml-0.5"
                                />
                            </div>

                            <ul className="space-y-3">
                                {basicFeatures.map((f) => (
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
                        </div>
                        )}

                        {/* Pro plan */}
                        <div
                            ref={proCardRef}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedTier === 'pro'}
                            className={`row-start-1 col-start-1 md:row-auto md:col-auto relative rounded-[24px] transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${isTrial ? 'cursor-default' : 'cursor-pointer'} ${selectedTier === 'pro'
                                ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:translate-y-0'
                                : 'z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                                }`}
                            onClick={() => !isTrial && setSelectedTier('pro')}
                            onKeyDown={(e) => { if (!isTrial && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelectedTier('pro'); } }}
                        >
                            <div className={`glow-blue flex h-full w-full flex-col rounded-[24px] p-[1px] border transition-all duration-300 ${selectedTier === 'pro' ? 'border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.25)] md:hover:-translate-y-1' : 'md:border-transparent md:hover:-translate-y-1 md:hover:border-cyan-400/50 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]'}`}>
                                <div className="relative rounded-[23px] bg-gradient-to-b from-[#0a1128] to-[#040715] p-7 h-full w-full">
                                    {isTrial ? (
                                        <button
                                            type="button"
                                            onClick={exitTrialMode}
                                            className={`absolute right-6 top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/20 text-white/40 hover:border-white/40 hover:text-white/70 transition-all duration-300 ${isTrialContentVisible ? 'opacity-100' : 'opacity-0'}`}
                                            aria-label="Exit trial mode"
                                        >
                                            <XIcon className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <div className="absolute right-6 top-6">
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${selectedTier === 'pro'
                                                ? 'border-cyan-400 bg-cyan-400'
                                                : 'border-white/20'
                                                }`}>
                                                {selectedTier === 'pro' && <Check className="h-4 w-4 text-[--color-background]" />}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold text-[--color-text]">Pro</h2>
                                        <p className="text-sm text-[--color-text-tertiary] mt-1">For daily use</p>
                                    </div>

                                    <div className="mb-7 flex items-end gap-3">
                                        {isTrial ? (
                                            <div className={`flex items-end gap-2 transition-opacity duration-300 ${isTrialContentVisible ? 'opacity-100' : 'opacity-0'}`}>
                                                <AnimatedPrice
                                                    price={billingPeriod === 'monthly' ? 2.99 : 0.99}
                                                    period={billingPeriod === 'monthly' ? 'mo' : 'wk'}
                                                    direction={direction}
                                                    priceClassName="text-4xl font-extrabold font-inter text-gradient-static"
                                                    periodClassName="text-sm text-[--color-text-tertiary] ml-0.5"
                                                />
                                                <div className="flex items-end">
                                                    <span className="text-2xl font-bold font-inter line-through text-[--color-text-tertiary] opacity-40">{billingPeriod === 'monthly' ? '$9.99' : '$3.49'}</span>
                                                    <span className="text-sm text-[--color-text-tertiary] opacity-40 mb-0.5 ml-0.5">{billingPeriod === 'monthly' ? '/mo' : '/wk'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <AnimatedPrice
                                                price={PRICES.pro[billingPeriod]}
                                                period={billingPeriod === 'monthly' ? 'mo' : 'wk'}
                                                direction={direction}
                                                priceClassName="text-4xl font-extrabold font-inter text-gradient-static"
                                                periodClassName="text-sm text-[--color-text-tertiary] ml-0.5"
                                            />
                                        )}
                                        {!isTrial && (
                                            <button
                                                type="button"
                                                onClick={(e) => enterTrialMode(e)}
                                                className="mb-1 flex-shrink-0 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-1.5 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-400/10 hover:border-cyan-400/50 whitespace-nowrap ml-3 sm:ml-0"
                                            >
                                                <span className="sm:hidden">Try $0.99/wk</span>
                                                <span className="hidden sm:inline">Try $0.99 for 7 days</span>
                                            </button>
                                        )}
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

                                    {isTrial && (
                                        <p className={`mt-5 text-center text-[11px] text-[--color-text-tertiary] opacity-50 transition-opacity duration-300 ${isTrialContentVisible ? 'opacity-50' : 'opacity-0'}`}>
                                            Cancel anytime · {billingPeriod === 'monthly' ? 'Renews at $9.99/mo' : 'Renews at $3.49/wk'}
                                        </p>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email + CTA section */}
                    <div className="mx-auto mt-12 max-w-2xl">
                        <div className="glass-card rounded-2xl p-8 md:p-10">
                            <h3 className="mb-2 text-center text-xl font-semibold text-[--color-text]">
                                {isTrial && selectedTier === 'pro' ? 'Start your Pro trial' : selectedTier === 'basic' ? 'Start your Basic subscription' : 'Start your Pro subscription'}
                            </h3>
                            <p className="mb-8 text-center text-[15px] text-[--color-text-tertiary]">
                                Enter your email to proceed to secure checkout via Stripe.
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
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>


                            {/* Result message */}
                            {result && (
                                result.type === 'info' ? (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                        className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                                                <AlertCircle className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <h3 className="mb-1.5 text-sm font-semibold text-amber-400">Already subscribed</h3>
                                            <p className="text-sm text-amber-200/70">{result.message}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                        className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5"
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                                                <AlertCircle className="h-5 w-5 text-red-400" />
                                            </div>
                                            <h3 className="mb-1.5 text-sm font-semibold text-red-400">Something went wrong</h3>
                                            <p className="text-sm text-red-200/70">{result.message}</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Footer */}
                        <p className="mt-6 text-center text-xs text-[--color-text-tertiary]">
                            Already have a key? Open the CaptureAI extension popup to activate it.
                        </p>
                    </div>
                </div>
            </div >

            {confirmationData && (
                <UpgradeConfirmModal
                    data={confirmationData}
                    visible={modalVisible}
                    loading={confirmLoading}
                    onConfirm={handleConfirmUpgrade}
                    onCancel={hideConfirmModal}
                />
            )}
        </>
    )
}

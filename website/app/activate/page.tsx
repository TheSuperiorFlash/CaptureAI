'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, X as XIcon, ArrowRight, Shield, MessageSquare, Repeat, Infinity as InfinityIcon, Minus, AlertCircle, Mail } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useSwipeTier } from '@/hooks/useSwipeTier'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    amountDueCents: number
    subtotalCents: number
    totalCents: number
    currency: string
    tier: string
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

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(data.amountDueCents / 100)

    const features = data.tier === 'pro' ? [
        'Unlimited AI requests — no daily cap',
        'Privacy Guard — stay undetected',
        'Ask Mode — follow-up questions',
        'Auto-Solve — hands-free answers',
    ] : [
        '50 AI requests per day',
        'Screenshot capture',
        'Floating interface',
        'Stealth Mode',
    ]

    const sendCode = async () => {
        setCodeSending(true)
        setCodeError(null)
        try {
            await apiPost(`${API_BASE_URL}/api/subscription/send-verification`, {
                email: data.email,
                tier: data.tier,
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
        <Dialog open={visible} onOpenChange={(open) => { if (!open) onCancel() }}>
            <DialogContent className="max-w-md rounded-[28px] border-cyan-400/25 bg-gradient-to-b from-[#09112a] to-[#040810] p-8 shadow-[0_0_80px_rgba(0,240,255,0.10),0_40px_80px_rgba(0,0,0,0.7)]">
                <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

                <DialogHeader className="items-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                            </span>
                            <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                                {data.tier === 'pro' ? 'Upgrade to Pro' : `Switch to ${data.tier}`}
                            </span>
                        </div>
                    </div>
                    <DialogDescription className="text-xs font-medium uppercase tracking-wider text-[--color-text-tertiary]">
                        Amount due today
                    </DialogDescription>
                    <DialogTitle className="font-inter text-[3.25rem] font-extrabold leading-none text-gradient-static">
                        {formattedAmount}
                    </DialogTitle>
                    <p className="text-sm text-[--color-text-tertiary]">Includes credit for any unused time on your current plan</p>
                </DialogHeader>

                <div className="divider-gradient my-5" />

                <ul className="mb-6 space-y-3">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                <Check className="h-3 w-3 text-cyan-400" />
                            </div>
                            <span className="text-sm text-[--color-text-secondary]">{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Verification code section */}
                <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-medium text-[--color-text-secondary]">
                            {codeSent ? `Code sent to ${data.email}` : 'Sending verification code...'}
                        </span>
                    </div>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={verificationCode}
                            onChange={(value) => handleCodeInput(value)}
                            onComplete={() => { if (canConfirm) onConfirm(verificationCode) }}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                    {codeError && (
                        <Alert variant="destructive" className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{codeError}</AlertDescription>
                        </Alert>
                    )}
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={sendCode}
                            disabled={codeSending || resendCooldown > 0}
                            className="text-xs text-[--color-text-tertiary] transition-colors hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {codeSending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                        </button>
                    </div>
                </div>

                <button type="button" onClick={() => onConfirm(verificationCode)} disabled={!canConfirm}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white transition-all ${
                        !canConfirm ? 'cursor-not-allowed bg-blue-600/40' : 'glow-btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.01]'
                    }`}>
                    {loading
                        ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" role="status" aria-label="Loading" />
                        : data.tier === 'pro' ? 'Confirm Upgrade' : 'Confirm Change'
                    }
                </button>

                <button type="button" onClick={onCancel}
                    className="mt-4 w-full text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]">
                    Cancel
                </button>
            </DialogContent>
        </Dialog>
    )
}

export default function ActivatePage() {
    const [email, setEmail] = useState('')
    const { selectedTier, setSelectedTier, handleTouchStart, handleTouchEnd, handleTouchCancel } = useSwipeTier()

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ResultState | null>(null)
    const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false)

    useEffect(() => {
        if (confirmationData) {
            const id = requestAnimationFrame(() => setModalVisible(true))
            return () => cancelAnimationFrame(id)
        } else {
            setModalVisible(false)
        }
    }, [confirmationData])

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
        const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email, tier: 'basic' })
        if (data.requiresConfirmation) {
            showConfirmModal({ amountDueCents: data.amountDueCents as number, subtotalCents: data.subtotalCents as number, totalCents: data.totalCents as number, currency: data.currency as string, tier: data.tier as string, email })
            return
        }
        if (data.url) { redirectToCheckout(data.url as string) } else { throw new Error('No checkout URL received') }
    }

    const handleProSignup = async () => {
        const data = await apiPost(`${API_BASE_URL}/api/subscription/create-checkout`, { email, tier: 'pro' })
        if (data.requiresConfirmation) {
            showConfirmModal({ amountDueCents: data.amountDueCents as number, subtotalCents: data.subtotalCents as number, totalCents: data.totalCents as number, currency: data.currency as string, tier: data.tier as string, email })
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

            <div className="relative z-10 mx-auto max-w-5xl px-6">
                {/* Header */}
                <div className="mx-auto mb-8 max-w-xl text-center">
                    <h1 className="mb-3">
                        <span className="text-[--color-text]">Choose your </span>
                        <span className="text-gradient-static">plan</span>
                    </h1>
                    <p className="text-[--color-text-secondary]">
                        Start basic for 50 requests per day, or unlock everything with Pro.
                    </p>
                </div>

                {/* Plans grid */}
                <div
                    className="mx-auto grid grid-cols-1 w-full max-w-4xl md:gap-6 md:grid-cols-2 perspective-[1200px]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                >
                    {/* Basic plan */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'basic'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative glass-card cursor-pointer rounded-2xl p-7 transition-all duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center flex flex-col ${selectedTier === 'basic'
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
                            <span className="text-4xl font-extrabold font-inter text-[--color-text]">$1.49</span>
                            <span className="text-sm text-[--color-text-tertiary]"> / week</span>
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

                    {/* Pro plan */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedTier === 'pro'}
                        className={`row-start-1 col-start-1 md:row-auto md:col-auto relative cursor-pointer rounded-[24px] glow-blue transition duration-500 origin-center w-[88%] md:w-full max-w-[340px] md:max-w-none justify-self-center ${selectedTier === 'pro'
                            ? 'z-20 translate-x-0 scale-100 rotate-0 opacity-100 md:translate-y-0'
                            : 'z-10 translate-x-12 sm:translate-x-16 scale-[0.85] rotate-6 opacity-40 md:z-auto md:translate-x-0 md:scale-100 md:rotate-0 md:opacity-100'
                            }`}
                        onClick={() => setSelectedTier('pro')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier('pro'); } }}
                    >
                        <div className={`flex h-full w-full flex-col rounded-[24px] p-[1px] border transition-all duration-300 ${selectedTier === 'pro' ? 'border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.25)] md:hover:-translate-y-1' : 'md:border-transparent md:hover:-translate-y-1 md:hover:border-cyan-400/50 md:hover:shadow-[0_0_40px_rgba(0,240,255,0.25)]'}`}>
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
                </div>

                {/* Email + CTA section */}
                <div className="mx-auto mt-12 max-w-2xl">
                    <div className="glass-card rounded-2xl p-8 md:p-10">
                        <h3 className="mb-2 text-center text-xl font-semibold text-[--color-text]">
                            {selectedTier === 'basic' ? 'Start your Basic subscription' : 'Start your Pro subscription'}
                        </h3>
                        <p className="mb-8 text-center text-[15px] text-[--color-text-tertiary]">
                            Enter your email to proceed to secure checkout via Stripe.
                        </p>

                        <div className="mx-auto max-w-lg mb-4 flex flex-col sm:flex-row gap-4">
                            <Input
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
                                className="min-w-0 flex-1 h-12 rounded-xl"
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
                            <Alert
                                variant={result.type === 'info' ? 'default' : 'destructive'}
                                className={`mt-5 rounded-xl ${
                                    result.type === 'info'
                                        ? 'border-amber-500/20 bg-amber-500/[0.05] text-amber-400 [&>svg]:text-amber-400'
                                        : ''
                                }`}
                            >
                                <AlertCircle className="h-5 w-5" />
                                <AlertDescription className={result.type === 'info' ? 'text-amber-200/70' : ''}>
                                    <span className={`block mb-1 text-sm font-semibold ${result.type === 'info' ? 'text-amber-400' : 'text-red-400'}`}>
                                        {result.type === 'info' ? 'Already subscribed' : 'Something went wrong'}
                                    </span>
                                    {result.message}
                                </AlertDescription>
                            </Alert>
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

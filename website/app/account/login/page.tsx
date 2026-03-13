'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/api'
import { useSession } from '@/hooks/useSession'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: sessionLoading, login } = useSession()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Redirect if already signed in
  useEffect(() => {
    if (!sessionLoading && isAuthenticated) {
      router.replace('/account')
    }
  }, [sessionLoading, isAuthenticated, router])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSendCode = async () => {
    const trimmed = email.trim()
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setEmail(trimmed)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-login-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
        mode: 'cors',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Server error: ${res.status}`)
      }

      setStep('code')
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
        mode: 'cors',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Invalid or expired code')
      }

      const data = await res.json()
      login(data.licenseKey, data.user)
      router.replace('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-login-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        mode: 'cors',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to resend code')
      }
      setResendCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError(null)
  }

  if (sessionLoading) {
    return (
      <div className="relative overflow-x-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 gradient-mesh" />
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6">
          <Skeleton className="mb-3 h-10 w-72" />
          <Skeleton className="mb-10 h-5 w-56" />
          <div className="w-full rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-8 backdrop-blur-xl">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-4 h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-x-hidden py-20 md:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-[--color-text] md:text-4xl">
            Sign in to your account
          </h1>
          <p className="text-[--color-text-secondary]">
            {step === 'email'
              ? 'Enter the email address used for your subscription'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-8 shadow-[0_0_80px_rgba(0,71,255,0.06),0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {step === 'email' ? (
            <>
              {/* Email step */}
              <Label htmlFor="login-email" className="mb-2 block">
                Email address
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendCode() }}
                className="mb-4 h-12"
              />

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="glow-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-base font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Code step */}
              <div className="mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-[--color-text-secondary]">
                  Code sent to <span className="font-medium text-[--color-text]">{email}</span>
                </span>
              </div>

              <div className="mb-6 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => { setCode(value); setError(null) }}
                  onComplete={() => { if (code.length === 5) setTimeout(handleVerifyCode, 0) }}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <span className="mx-2 text-[--color-text-tertiary]">-</span>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white transition-all ${
                  code.length !== 6
                    ? 'cursor-not-allowed bg-blue-600/40'
                    : 'glow-btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.01]'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(null) }}
                  className="flex items-center gap-1 text-sm text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-[--color-text-tertiary] transition-colors hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[--color-text-tertiary]">
            Don&apos;t have an account?{' '}
            <Link href="/activate" className="text-blue-400 transition-colors hover:text-cyan-400">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

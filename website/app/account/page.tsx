'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  BarChart3,
  User,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useSession } from '@/hooks/useSession'

interface UsageData {
  today: {
    used: number
    limit: number | null
    percentage: number | null
    remaining: number | null
  }
  tier: string
  limitType: string
  perMinute?: {
    used: number
    limit: number
  }
}

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: sessionLoading, user, licenseKey, authHeaders, logout } = useSession()

  const [usage, setUsage] = useState<UsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [keyRevealed, setKeyRevealed] = useState(false)

  // Redirect if not signed in
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace('/account/login')
    }
  }, [sessionLoading, isAuthenticated, router])

  // Fetch usage data
  const fetchUsage = useCallback(async () => {
    if (!licenseKey) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/usage`, {
        headers: authHeaders as Record<string, string>,
        mode: 'cors',
      })
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch {
      // Usage fetch is non-critical
    } finally {
      setUsageLoading(false)
    }
  }, [licenseKey, authHeaders])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsage()
    }
  }, [isAuthenticated, fetchUsage])

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/portal`, {
        headers: authHeaders as Record<string, string>,
        mode: 'cors',
      })
      if (res.ok) {
        const data = await res.json()
        window.open(data.url, '_blank')
      }
    } catch {
      // Portal errors handled silently
    } finally {
      setPortalLoading(false)
    }
  }

  const copyLicenseKey = async () => {
    if (!licenseKey) return
    await navigator.clipboard.writeText(licenseKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskKey = (key: string) => {
    const parts = key.split('-')
    if (parts.length < 3) return key
    return parts.slice(0, 2).join('-') + '-' + parts.slice(2).map(() => '****').join('-')
  }

  const handleSignOut = () => {
    logout()
    router.replace('/account/login')
  }

  const tierColor = user?.tier === 'pro'
    ? 'text-cyan-400 border-cyan-400/20 bg-cyan-400/[0.06]'
    : 'text-blue-400 border-blue-400/20 bg-blue-400/[0.06]'

  const statusColor = user?.subscriptionStatus === 'active'
    ? 'text-emerald-400'
    : user?.subscriptionStatus === 'past_due'
      ? 'text-amber-400'
      : 'text-red-400'

  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="relative overflow-x-hidden py-20 md:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600 gradient-blur gradient-blur-animated animate-pulse-glow" />

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-[--color-text] md:text-4xl">Account</h1>
          <p className="text-[--color-text-secondary]">Manage your subscription, usage, and billing</p>
        </div>

        <div className="space-y-5">

          {/* Subscription Card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                <Zap className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-[--color-text]">Subscription</h2>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tierColor}`}>
                {user.tier === 'pro' ? (
                  <><Shield className="mr-1.5 h-3 w-3" /> Pro</>
                ) : (
                  user.tier ?? 'No Plan'
                )}
              </span>
              <span className={`text-sm font-medium capitalize ${statusColor}`}>
                {user.subscriptionStatus === 'active' ? '● Active' :
                 user.subscriptionStatus === 'past_due' ? '● Past Due' :
                 user.subscriptionStatus === 'cancelled' ? '● Cancelled' :
                 '● Inactive'}
              </span>
            </div>

            <p className="mb-5 text-sm text-[--color-text-tertiary]">
              Member since {formattedDate}
            </p>

            <Link
              href="/activate"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 transition-colors hover:text-cyan-400"
            >
              Change plan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Usage Card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
                <BarChart3 className="h-4.5 w-4.5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-[--color-text]">Usage Today</h2>
            </div>

            {usageLoading ? (
              <div className="flex h-16 items-center">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : usage ? (
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-[--color-text] font-inter">
                    {usage.today.used}
                  </span>
                  <span className="text-sm text-[--color-text-tertiary]">
                    {usage.today.limit !== null
                      ? `/ ${usage.today.limit} requests`
                      : 'requests today'}
                  </span>
                </div>

                {/* Progress bar */}
                {usage.today.limit !== null && (
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(usage.today.percentage ?? 0, 100)}%` }}
                    />
                  </div>
                )}

                {usage.today.remaining !== null && usage.today.remaining !== undefined && (
                  <p className="text-sm text-[--color-text-tertiary]">
                    {usage.today.remaining} remaining today
                  </p>
                )}

                {usage.perMinute && (
                  <p className="mt-2 text-sm text-[--color-text-tertiary]">
                    {usage.perMinute.used} / {usage.perMinute.limit} per minute
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[--color-text-tertiary]">Unable to load usage data</p>
            )}
          </div>

          {/* Billing Card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-[--color-text]">Billing</h2>
            </div>

            <p className="mb-5 text-sm text-[--color-text-secondary]">
              Manage your payment method, view invoices, or cancel your subscription through the Stripe billing portal.
            </p>

            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Manage Billing
                  <ExternalLink className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Account Card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                <User className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-[--color-text]">Account Details</h2>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-text-tertiary]">Email</p>
                <p className="text-sm text-[--color-text]">{user.email}</p>
              </div>

              {/* License key */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[--color-text-tertiary]">License key</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyRevealed(!keyRevealed)}
                    className="font-mono text-sm text-[--color-text-secondary] transition-colors hover:text-[--color-text] cursor-pointer"
                  >
                    {licenseKey ? (keyRevealed ? licenseKey : maskKey(licenseKey)) : '—'}
                  </button>
                  <button
                    type="button"
                    onClick={copyLicenseKey}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[--color-text-tertiary] transition-colors hover:bg-white/[0.06] hover:text-[--color-text]"
                    aria-label="Copy license key"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="divider-gradient my-5" />

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-400 transition-colors hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

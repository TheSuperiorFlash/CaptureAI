'use client'

// Design direction: Minimalist / Refined within Abyssal Neon
// Differentiator: Circular SVG aperture ring — the "lens ring" ties to CaptureAI's screenshot capture metaphor

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Zap,
  Shield,
  ArrowUpRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  perMinute?: { used: number; limit: number }
}

// Circular aperture ring — the signature differentiator
function UsageRing({
  used,
  limit,
  percentage,
  isPro,
}: {
  used: number
  limit: number | null
  percentage: number | null
  isPro: boolean
}) {
  const size = 156
  const strokeWidth = 10
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const pct = limit !== null ? Math.min(percentage ?? 0, 100) : (used > 0 ? 100 : 0)
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isPro ? '#00f0ff' : '#0047ff'} />
            <stop offset="100%" stopColor={isPro ? '#0047ff' : '#00c8ff'} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={limit === null ? 0 : dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-inter text-3xl font-bold leading-none text-white">{used}</span>
        <span className="mt-1 font-inter text-xs text-[--color-text-tertiary]">
          {limit !== null ? `/ ${limit}` : 'today'}
        </span>
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const isPro = tier === 'pro'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
        isPro
          ? 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.2)]'
          : 'border-blue-400/20 bg-blue-400/[0.07] text-blue-300'
      }`}
    >
      {isPro ? <Shield className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
      {isPro ? 'Pro' : (tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Basic')}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    active: { color: 'text-emerald-400', label: '● Active' },
    past_due: { color: 'text-amber-400', label: '● Past due' },
    cancelled: { color: 'text-red-400', label: '● Cancelled' },
  }
  const { color, label } = cfg[status] ?? { color: 'text-[--color-text-tertiary]', label: '● Inactive' }
  return <span className={`text-sm font-medium ${color}`}>{label}</span>
}

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: sessionLoading, user, licenseKey, authHeaders, logout } =
    useSession()

  const [usage, setUsage] = useState<UsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [keyRevealed, setKeyRevealed] = useState(false)

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace('/account/login')
    }
  }, [sessionLoading, isAuthenticated, router])

  const fetchUsage = useCallback(async () => {
    if (!licenseKey) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/usage`, {
        headers: authHeaders as Record<string, string>,
        mode: 'cors',
      })
      if (res.ok) setUsage(await res.json())
    } catch {
      // non-critical
    } finally {
      setUsageLoading(false)
    }
  }, [licenseKey, authHeaders])

  useEffect(() => {
    if (isAuthenticated) fetchUsage()
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
      // silent
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
    if (key.length <= 4) return key
    return '••••' + key.slice(-4)
  }

  const handleSignOut = () => {
    logout()
    router.replace('/account/login')
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const isPro = user.tier === 'pro'
  const pct = usage?.today.percentage ?? 0
  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="relative min-h-screen overflow-x-hidden py-20 md:py-28">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div
        className={`pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full gradient-blur animate-pulse-glow ${
          isPro ? 'bg-cyan-500' : 'bg-blue-600'
        }`}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6">

        {/* ─── Profile header ─── */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-inter text-lg font-bold text-white shadow-lg ${
                isPro
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20'
                  : 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-600/20'
              }`}
            >
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{user.email}</p>
              <p className="mt-0.5 text-xs text-[--color-text-tertiary]">Member since {formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TierBadge tier={user.tier ?? 'basic'} />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg p-2 text-[--color-text-tertiary] transition-colors hover:bg-white/[0.05] hover:text-red-400"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden text-sm sm:block">Sign out</span>
            </button>
          </div>
        </div>

        {/* ─── Main card: Usage ring + Subscription ─── */}
        <div className="mb-4 overflow-hidden rounded-[24px] border border-white/[0.07] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">

            {/* Usage ring */}
            <div className="flex flex-col items-center gap-3">
              {usageLoading ? (
                <div
                  className="flex items-center justify-center"
                  style={{ width: 156, height: 156 }}
                >
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              ) : (
                <UsageRing
                  used={usage?.today.used ?? 0}
                  limit={usage?.today.limit ?? null}
                  percentage={pct}
                  isPro={isPro}
                />
              )}
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest text-[--color-text-tertiary]">
                  Usage Today
                </p>
                {!usageLoading && usage?.today.remaining !== null &&
                  usage?.today.remaining !== undefined && (
                    <p className="mt-0.5 text-xs text-[--color-text-secondary]">
                      {usage.today.remaining} remaining
                    </p>
                  )}
                {!usageLoading && usage?.today.limit === null && (
                  <p className="mt-0.5 text-xs text-[--color-text-secondary]">Unlimited</p>
                )}
              </div>
            </div>

            {/* Vertical divider (desktop) */}
            <div
              className="hidden h-28 w-px shrink-0 md:block"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)',
              }}
            />

            {/* Horizontal divider (mobile) */}
            <div
              className="h-px w-full md:hidden"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)',
              }}
            />

            {/* Subscription info */}
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={user.subscriptionStatus ?? 'inactive'} />
                {usage?.perMinute && (
                  <span className="text-xs text-[--color-text-tertiary]">
                    {usage.perMinute.used}&nbsp;/&nbsp;{usage.perMinute.limit} /min
                  </span>
                )}
              </div>

              {/* Progress bar (Basic tier only) */}
              {!isPro && !usageLoading && usage?.today.limit !== null && (
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-xs text-[--color-text-tertiary]">Daily limit</span>
                    <span className="font-inter text-xs tabular-nums text-[--color-text-secondary]">
                      {usage?.today.used ?? 0}&nbsp;/&nbsp;{usage?.today.limit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs text-[--color-text-tertiary]">
                  {isPro ? (
                    <p>Monthly subscription • Auto-renews</p>
                  ) : (
                    <p>Weekly subscription • Auto-renews</p>
                  )}
                </div>
                <Separator className="bg-white/[0.06]" />
                <Link
                  href="/activate"
                  className="inline-flex w-fit items-center gap-1 text-sm text-[--color-text-secondary] transition-colors hover:text-white"
                >
                  Change plan
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom row ─── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Account details */}
          <div className="rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 backdrop-blur-xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-[--color-text-tertiary]">
              Account
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-[--color-text-tertiary]">Email</p>
                <p className="text-sm text-white">{user.email}</p>
              </div>

              <div className="divider-gradient" />

              <div>
                <p className="mb-2 text-xs text-[--color-text-tertiary]">License key</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-[--color-text-secondary]">
                    {licenseKey ? (keyRevealed ? licenseKey : maskKey(licenseKey)) : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        onClick={() => setKeyRevealed(!keyRevealed)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[--color-text-tertiary] transition-colors hover:bg-white/[0.06] hover:text-white"
                        aria-label={keyRevealed ? 'Hide license key' : 'Reveal license key'}
                      >
                        {keyRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </TooltipTrigger>
                      <TooltipContent>{keyRevealed ? 'Hide' : 'Reveal'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        onClick={copyLicenseKey}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[--color-text-tertiary] transition-colors hover:bg-white/[0.06] hover:text-white"
                        aria-label="Copy license key"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>{copied ? 'Copied!' : 'Copy to clipboard'}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="divider-gradient" />

              <div>
                <p className="mb-1 text-xs text-[--color-text-tertiary]">Privacy</p>
                <a
                  href={`mailto:support@captureai.dev?subject=Data Export Request&body=Please export all data associated with my account: ${user.email}`}
                  className="text-xs text-[--color-text-tertiary] transition-colors hover:text-[--color-text-secondary] underline underline-offset-2"
                >
                  Request data export
                </a>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="rounded-[20px] border border-white/[0.07] bg-gradient-to-b from-[#0c1125]/80 to-[#060913]/80 p-6 backdrop-blur-xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-[--color-text-tertiary]">
              Billing
            </p>
            <p className="mb-6 text-sm leading-relaxed text-[--color-text-secondary]">
              Update your payment method, view invoices, or cancel your subscription via the Stripe
              portal.
            </p>
            <Button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="glow-btn h-11 w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

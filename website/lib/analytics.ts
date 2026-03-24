type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: EventParams) => void
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void }
  }
}

export function trackEvent(action: string, params?: EventParams) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params)
  }
}

export function trackTikTokEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !window.ttq) return
  window.ttq.track(eventName, params)
}

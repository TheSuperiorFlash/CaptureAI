type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: EventParams) => void
  }
}

export function trackEvent(action: string, params?: EventParams) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params)
  }
}

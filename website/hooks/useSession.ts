'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL } from '@/lib/api'

const SESSION_KEY = 'captureai-web-session'
const USER_KEY = 'captureai-web-user'

export interface SessionUser {
  email: string
  tier: string | null
  subscriptionStatus: string
  createdAt: string
}

interface SessionState {
  licenseKey: string | null
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    licenseKey: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const didFetch = useRef(false)

  const authHeaders = state.licenseKey
    ? { Authorization: `LicenseKey ${state.licenseKey}` }
    : {}

  // Fetch fresh user data from API
  const fetchUser = useCallback(async (key: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `LicenseKey ${key}` },
        mode: 'cors',
      })
      if (!res.ok) {
        // Invalid key — clear session
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(USER_KEY)
        setState({ licenseKey: null, user: null, isLoading: false, isAuthenticated: false })
        return
      }
      const data = await res.json()
      const user: SessionUser = {
        email: data.email,
        tier: data.tier,
        subscriptionStatus: data.subscriptionStatus,
        createdAt: data.createdAt,
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      setState({ licenseKey: key, user, isLoading: false, isAuthenticated: true })
    } catch {
      // Network error — use cached user if available
      const cached = localStorage.getItem(USER_KEY)
      if (cached) {
        const user = JSON.parse(cached) as SessionUser
        setState({ licenseKey: key, user, isLoading: false, isAuthenticated: true })
      } else {
        setState({ licenseKey: key, user: null, isLoading: false, isAuthenticated: true })
      }
    }
  }, [])

  // Initialize from localStorage
  useEffect(() => {
    const key = localStorage.getItem(SESSION_KEY)
    if (!key) {
      setState({ licenseKey: null, user: null, isLoading: false, isAuthenticated: false })
      return
    }

    // Load cached user immediately for fast UI
    const cached = localStorage.getItem(USER_KEY)
    if (cached) {
      const user = JSON.parse(cached) as SessionUser
      setState({ licenseKey: key, user, isLoading: false, isAuthenticated: true })
    }

    // Fetch fresh data (once)
    if (!didFetch.current) {
      didFetch.current = true
      fetchUser(key)
    }
  }, [fetchUser])

  const login = useCallback((licenseKey: string, user: SessionUser) => {
    localStorage.setItem(SESSION_KEY, licenseKey)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setState({ licenseKey, user, isLoading: false, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
    setState({ licenseKey: null, user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return {
    ...state,
    authHeaders,
    login,
    logout,
  }
}

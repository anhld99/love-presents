import { useState, useEffect, useCallback } from 'react'
import {
  checkSession,
  completeGoogleLogin as apiCompleteGoogleLogin,
  logout as apiLogout,
  type SessionState,
  type UserRole,
} from '../lib/api'
import { getSupabaseBrowserClient } from '../lib/supabase'

const SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true'

interface UseAuthReturn {
  authenticated: boolean
  checking: boolean
  role: UserRole | null
  hasCouple: boolean
  email: string | null
  startGoogleLogin: (nextPath?: string) => Promise<void>
  finishGoogleLogin: () => Promise<void>
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [authenticated, setAuthenticated] = useState(SKIP_AUTH)
  const [checking, setChecking] = useState(!SKIP_AUTH)
  const [role, setRole] = useState<UserRole | null>(SKIP_AUTH ? 'anh' : null)
  const [hasCouple, setHasCouple] = useState(SKIP_AUTH)
  const [email, setEmail] = useState<string | null>(SKIP_AUTH ? 'dev@example.com' : null)

  const applySession = useCallback((state: SessionState) => {
    setAuthenticated(state.authenticated)
    setRole(state.role)
    setHasCouple(state.hasCouple)
    setEmail(state.email)
  }, [])

  const refreshSession = useCallback(async () => {
    if (SKIP_AUTH) {
      applySession({ authenticated: true, role: 'anh', hasCouple: true, email: 'dev@example.com' })
      setChecking(false)
      return
    }

    const state = await checkSession()
    applySession(state)
    setChecking(false)
  }, [applySession])

  useEffect(() => {
    if (SKIP_AUTH) return

    let alive = true

    checkSession()
      .then(state => {
        if (!alive) return
        applySession(state)
        setChecking(false)
      })
      .catch(() => {
        if (!alive) return
        setAuthenticated(false)
        setRole(null)
        setHasCouple(false)
        setEmail(null)
        setChecking(false)
      })

    return () => {
      alive = false
    }
  }, [applySession])

  const startGoogleLogin = useCallback(async (nextPath = '/') => {
    if (SKIP_AUTH) {
      applySession({ authenticated: true, role: 'anh', hasCouple: true, email: 'dev@example.com' })
      return
    }

    const supabase = getSupabaseBrowserClient()
    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', nextPath)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo.toString(),
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [applySession])

  const finishGoogleLogin = useCallback(async () => {
    if (SKIP_AUTH) {
      applySession({ authenticated: true, role: 'anh', hasCouple: true, email: 'dev@example.com' })
      return
    }

    const supabase = getSupabaseBrowserClient()

    const authCode = new URL(window.location.href).searchParams.get('code')
    if (authCode) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
      if (exchangeError) {
        throw new Error(exchangeError.message)
      }
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error(error.message)
    }

    const accessToken = data.session?.access_token
    if (!accessToken) {
      throw new Error('Không lấy được phiên Google, vui lòng thử lại')
    }

    const state = await apiCompleteGoogleLogin(accessToken)
    applySession(state)
    setChecking(false)
    await supabase.auth.signOut()
  }, [applySession])

  const logout = useCallback(async () => {
    if (SKIP_AUTH) {
      setAuthenticated(false)
      setRole(null)
      setHasCouple(false)
      setEmail(null)
      return
    }

    await apiLogout()
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    setAuthenticated(false)
    setRole(null)
    setHasCouple(false)
    setEmail(null)
  }, [])

  return {
    authenticated,
    checking,
    role,
    hasCouple,
    email,
    startGoogleLogin,
    finishGoogleLogin,
    refreshSession,
    logout,
  }
}

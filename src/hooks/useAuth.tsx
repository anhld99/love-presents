import { useState, useEffect, useCallback } from 'react'
import { checkSession, login as apiLogin, logout as apiLogout } from '../lib/api'

const SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true'

interface UseAuthReturn {
  authenticated: boolean
  checking: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [authenticated, setAuthenticated] = useState(SKIP_AUTH)
  const [checking, setChecking] = useState(!SKIP_AUTH)

  useEffect(() => {
    if (SKIP_AUTH) return

    let alive = true

    checkSession().then(ok => {
      if (!alive) return
      setAuthenticated(ok)
      setChecking(false)
    })

    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (password: string) => {
    if (SKIP_AUTH) {
      setAuthenticated(true)
      return
    }

    await apiLogin(password)
    setAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    if (SKIP_AUTH) {
      setAuthenticated(false)
      return
    }

    await apiLogout()
    setAuthenticated(false)
  }, [])

  return { authenticated, checking, login, logout }
}

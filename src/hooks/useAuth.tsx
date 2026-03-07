import { useState, useEffect, useCallback } from 'react'
import { checkSession, login as apiLogin, logout as apiLogout } from '../lib/api'

interface UseAuthReturn {
  authenticated: boolean
  checking: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkSession().then(ok => {
      setAuthenticated(ok)
      setChecking(false)
    })
  }, [])

  const login = useCallback(async (password: string) => {
    await apiLogin(password)
    setAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setAuthenticated(false)
  }, [])

  return { authenticated, checking, login, logout }
}

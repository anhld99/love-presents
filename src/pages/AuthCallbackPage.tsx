import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface AuthCallbackPageProps {
  onComplete: () => Promise<void>
}

export function AuthCallbackPage({ onComplete }: AuthCallbackPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        await onComplete()
        if (!alive) return
        const next = normalizeNextPath(searchParams.get('next'))
        navigate(next, { replace: true })
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Không thể hoàn tất đăng nhập Google')
      }
    }

    void run()

    return () => {
      alive = false
    }
  }, [navigate, onComplete, searchParams])

  return (
    <div className="spinner-wrap spinner-wrap-fullscreen">
      <div>
        <div className="spinner" />
        <p className="login-footnote">Đang hoàn tất đăng nhập Google...</p>
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  )
}

function normalizeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/'
  return next
}

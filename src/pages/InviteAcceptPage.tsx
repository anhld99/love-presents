import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

interface InviteAcceptPageProps {
  authenticated: boolean
  checking: boolean
  onStartGoogleLogin: (nextPath?: string) => Promise<void>
  onAcceptInvite: (token: string) => Promise<void>
  onRefreshSession: () => Promise<void>
}

export function InviteAcceptPage({
  authenticated,
  checking,
  onStartGoogleLogin,
  onAcceptInvite,
  onRefreshSession,
}: InviteAcceptPageProps) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const nextPath = useMemo(() => `/invite/accept?token=${encodeURIComponent(token)}`, [token])

  useEffect(() => {
    if (!authenticated || !token || success) return

    let alive = true

    async function run() {
      setLoading(true)
      setError('')
      try {
        await onAcceptInvite(token)
        await onRefreshSession()
        if (!alive) return
        setSuccess(true)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Không thể xác nhận lời mời')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      alive = false
    }
  }, [authenticated, token, success, onAcceptInvite, onRefreshSession])

  if (checking) {
    return (
      <div className="spinner-wrap spinner-wrap-fullscreen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Invitation</p>
          <h1 className="page-title">Xác nhận lời mời vào couple</h1>
          <p className="page-subtitle">Bạn cần đăng nhập Google đúng email được mời để xác nhận.</p>
        </div>
      </section>

      {!token && <div className="alert alert-error">Link mời không hợp lệ vì thiếu token.</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success">
          Xác nhận thành công! Bạn đã vào couple với vai trò em. <Link to="/add">Bắt đầu thêm quà</Link>
        </div>
      )}

      {!authenticated && token && (
        <div className="card">
          <h3>Đăng nhập Google để xác nhận</h3>
          <p className="page-subtitle">Sau khi đăng nhập, hệ thống sẽ tự động hoàn tất lời mời.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              void onStartGoogleLogin(nextPath)
            }}
          >
            Đăng nhập với Google
          </button>
        </div>
      )}

      {authenticated && token && !success && (
        <div className="card">
          <h3>{loading ? 'Đang xác nhận...' : 'Đang xử lý lời mời'}</h3>
          <p className="page-subtitle">Vui lòng đợi trong giây lát.</p>
          {loading && (
            <div className="spinner-wrap">
              <div className="spinner" />
            </div>
          )}
        </div>
      )}
    </main>
  )
}

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Vui lòng nhập mật khẩu'); return }
    setLoading(true)
    setError('')
    try {
      await login(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-icon">💝</div>
        <h1 className="login-title">Love Presents</h1>
        <p className="login-sub">Nhập mật khẩu để vào danh sách quà tặng</p>

        <form className="login-form" onSubmit={e => { void handleSubmit(e) }}>
          <input
            className="form-input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoFocus
          />
          {error && <div className="alert alert-error">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Đang vào...' : 'Vào danh sách'}
          </button>
        </form>
      </div>
    </div>
  )
}

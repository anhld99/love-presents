import { useState } from 'react'

interface LoginPageProps {
  onLogin: (password: string) => Promise<void>
  theme: 'romantic' | 'anniversary'
  onToggleTheme: () => void
}

export function LoginPage({ onLogin, theme, onToggleTheme }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Vui lòng nhập mật khẩu'); return }
    setLoading(true)
    setError('')
    try {
      await onLogin(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-glow login-glow-alt" aria-hidden="true" />
      <div className="login-card">
        <button className="login-theme-toggle" type="button" onClick={onToggleTheme}>
          {theme === 'anniversary' ? '🎀 Chế độ lãng mạn' : '🎉 Chế độ kỷ niệm'}
        </button>
        <p className="login-chip">Private wishbook</p>
        <div className="login-icon">💝</div>
        <h1 className="login-title">Love Presents</h1>
        <p className="login-sub">Mở chiếc hộp nhỏ chứa những món quà bạn mong chờ nhất.</p>

        <form className="login-form" onSubmit={e => { void handleSubmit(e) }}>
          <input
            className="form-input"
            type="password"
            placeholder="Nhập mật khẩu của hai bạn"
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
        <p className="login-footnote">Mỗi món quà là một lời yêu thương được lưu lại.</p>
      </div>
    </div>
  )
}

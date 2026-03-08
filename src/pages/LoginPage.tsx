import { useState } from 'react'

interface LoginPageProps {
  onLogin: () => Promise<void>
  theme: 'romantic' | 'anniversary'
  onToggleTheme: () => void
}

export function LoginPage({ onLogin, theme, onToggleTheme }: LoginPageProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    try {
      await onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập Google')
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

        <div className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          <button
            type="button"
            className="btn btn-primary btn-full login-google"
            disabled={loading}
            onClick={() => {
              void handleGoogleLogin()
            }}
          >
            {loading ? 'Đang chuyển hướng...' : 'Đăng nhập với Google'}
          </button>
        </div>
        <p className="login-footnote">Mỗi món quà là một lời yêu thương được lưu lại.</p>
      </div>
    </div>
  )
}

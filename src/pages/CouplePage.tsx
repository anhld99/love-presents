import { useState, type FormEvent } from 'react'

interface CouplePageProps {
  hasCouple: boolean
  role: 'anh' | 'em' | null
  email: string | null
  onCreateCouple: (name: string) => Promise<void>
  onInviteEm: (email: string) => Promise<void>
}

export function CouplePage({ hasCouple, role, email, onCreateCouple, onInviteEm }: CouplePageProps) {
  const [coupleName, setCoupleName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [error, setError] = useState('')

  async function handleCreateCouple(e: FormEvent) {
    e.preventDefault()
    setLoadingCreate(true)
    setError('')
    setCreateMessage('')

    try {
      await onCreateCouple(coupleName)
      setCreateMessage('Đã tạo couple thành công!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo couple')
    } finally {
      setLoadingCreate(false)
    }
  }

  async function handleInviteEm(e: FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setError('Vui lòng nhập email của em để gửi lời mời')
      return
    }

    setLoadingInvite(true)
    setError('')
    setInviteMessage('')

    try {
      await onInviteEm(inviteEmail)
      setInviteMessage('Đã gửi email xác nhận cho em. Hãy kiểm tra hộp thư nhé!')
      setInviteEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi email mời')
    } finally {
      setLoadingInvite(false)
    }
  }

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Couple Setup</p>
          <h1 className="page-title">Thiết lập couple</h1>
          <p className="page-subtitle">
            {hasCouple
              ? 'Couple giúp giới hạn mỗi tài khoản chỉ thuộc một cặp duy nhất.'
              : 'Bạn cần tạo hoặc nhận lời mời vào couple trước khi thêm quà.'}
          </p>
        </div>
      </section>

      {email && <div className="alert">Đăng nhập: {email}</div>}
      {error && <div className="alert alert-error alert-spaced">{error}</div>}

      {!hasCouple && (
        <div className="card">
          <h3>Tạo couple với vai trò anh</h3>
          <p className="page-subtitle">Sau khi tạo xong, bạn có thể mời em qua email xác nhận.</p>
          {createMessage && <div className="alert alert-success alert-spaced">{createMessage}</div>}
          <form className="form-grid" onSubmit={e => { void handleCreateCouple(e) }}>
            <div className="form-group">
              <label className="form-label">Tên couple</label>
              <input
                className="form-input"
                placeholder="Ví dụ: Minh & Linh"
                value={coupleName}
                onChange={e => setCoupleName(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary form-submit" disabled={loadingCreate}>
                {loadingCreate ? 'Đang tạo...' : 'Tạo couple'}
              </button>
            </div>
          </form>
        </div>
      )}

      {hasCouple && role === 'anh' && (
        <div className="card">
          <h3>Mời em vào couple</h3>
          <p className="page-subtitle">Hệ thống sẽ gửi email có link xác nhận cho em.</p>
          {inviteMessage && <div className="alert alert-success alert-spaced">{inviteMessage}</div>}
          <form className="form-grid" onSubmit={e => { void handleInviteEm(e) }}>
            <div className="form-group">
              <label className="form-label">Email của em</label>
              <input
                className="form-input"
                type="email"
                placeholder="em@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary form-submit" disabled={loadingInvite}>
                {loadingInvite ? 'Đang gửi...' : 'Gửi email mời'}
              </button>
            </div>
          </form>
        </div>
      )}

      {hasCouple && role === 'em' && (
        <div className="card">
          <h3>Bạn đã tham gia couple với vai trò em</h3>
          <p className="page-subtitle">Bạn chỉ có quyền thêm quà, không xem danh sách quà.</p>
        </div>
      )}
    </main>
  )
}

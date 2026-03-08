import { useEffect, useState, type FormEvent } from 'react'
import type { CoupleActivity, CoupleInvite } from '../lib/api'

interface CouplePageProps {
  hasCouple: boolean
  role: 'anh' | 'em' | null
  email: string | null
  onCreateCouple: (name: string) => Promise<void>
  onInviteEm: (email: string) => Promise<void>
  onFetchInvites: () => Promise<CoupleInvite[]>
  onResendInvite: (inviteId: string) => Promise<void>
  onCancelInvite: (inviteId: string) => Promise<void>
  onFetchActivity: () => Promise<CoupleActivity[]>
}

export function CouplePage({
  hasCouple,
  role,
  email,
  onCreateCouple,
  onInviteEm,
  onFetchInvites,
  onResendInvite,
  onCancelInvite,
  onFetchActivity,
}: CouplePageProps) {
  const [coupleName, setCoupleName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [error, setError] = useState('')

  const [invites, setInvites] = useState<CoupleInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [inviteActionId, setInviteActionId] = useState('')

  const [activity, setActivity] = useState<CoupleActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    if (!hasCouple) {
      setInvites([])
      setActivity([])
      return
    }

    let alive = true

    async function run() {
      if (role === 'anh') {
        setInvitesLoading(true)
      }
      setActivityLoading(true)

      try {
        if (role === 'anh') {
          const inviteList = await onFetchInvites()
          if (alive) {
            setInvites(inviteList)
          }
        }

        const activityList = await onFetchActivity()
        if (alive) {
          setActivity(activityList)
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu couple')
        }
      } finally {
        if (alive) {
          setInvitesLoading(false)
          setActivityLoading(false)
        }
      }
    }

    void run()

    return () => {
      alive = false
    }
  }, [hasCouple, role, onFetchInvites, onFetchActivity])

  async function reloadInvites() {
    if (role !== 'anh') return
    const inviteList = await onFetchInvites()
    setInvites(inviteList)
  }

  async function reloadActivity() {
    const activityList = await onFetchActivity()
    setActivity(activityList)
  }

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
      await reloadInvites()
      await reloadActivity()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi email mời')
    } finally {
      setLoadingInvite(false)
    }
  }

  async function handleResendInvite(inviteId: string) {
    setInviteActionId(inviteId)
    setError('')
    setInviteMessage('')
    try {
      await onResendInvite(inviteId)
      setInviteMessage('Đã gửi lại email mời thành công.')
      await reloadInvites()
      await reloadActivity()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại lời mời')
    } finally {
      setInviteActionId('')
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setInviteActionId(inviteId)
    setError('')
    try {
      await onCancelInvite(inviteId)
      await reloadInvites()
      await reloadActivity()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể huỷ lời mời')
    } finally {
      setInviteActionId('')
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
        <div className="card couple-card">
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
        <>
          <div className="card couple-card">
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

          <div className="card couple-card">
            <h3>Lịch sử lời mời</h3>
            <p className="page-subtitle">Theo dõi trạng thái lời mời và gửi lại khi cần.</p>
            {invitesLoading && <p className="card-caption">Đang tải lời mời...</p>}
            {!invitesLoading && invites.length === 0 && <p className="card-caption">Chưa có lời mời nào.</p>}

            {!invitesLoading && invites.length > 0 && (
              <div className="invite-list">
                {invites.map(invite => {
                  const isPending = invite.status === 'pending'
                  const canResend = invite.status !== 'accepted'

                  return (
                    <div key={invite.id} className="invite-row">
                      <div className="invite-row-main">
                        <p className="invite-email">{invite.inviteeEmail}</p>
                        <p className="invite-meta">Gửi lúc {formatDate(invite.createdAt)} • Hết hạn {formatDate(invite.expiresAt)}</p>
                      </div>
                      <div className="invite-row-actions">
                        <span className={`invite-status status-${invite.status}`}>{statusLabel(invite.status)}</span>
                        {canResend && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={inviteActionId === invite.id}
                            onClick={() => {
                              void handleResendInvite(invite.id)
                            }}
                          >
                            Gửi lại
                          </button>
                        )}
                        {isPending && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={inviteActionId === invite.id}
                            onClick={() => {
                              void handleCancelInvite(invite.id)
                            }}
                          >
                            Huỷ
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {hasCouple && role === 'em' && (
        <div className="card couple-card">
          <h3>Bạn đã tham gia couple với vai trò em</h3>
          <p className="page-subtitle">Bạn chỉ có quyền thêm quà, không xem danh sách quà.</p>
        </div>
      )}

      {hasCouple && (
        <div className="card couple-card">
          <h3>Hoạt động gần đây</h3>
          <p className="page-subtitle">Những thay đổi mới nhất trong couple của hai bạn.</p>
          {activityLoading && <p className="card-caption">Đang tải hoạt động...</p>}
          {!activityLoading && activity.length === 0 && <p className="card-caption">Chưa có hoạt động nào.</p>}

          {!activityLoading && activity.length > 0 && (
            <div className="activity-list">
              {activity.map(item => (
                <div key={item.id} className="activity-row">
                  <p className="activity-title">{item.title}</p>
                  <p className="activity-meta">{formatDate(item.at)}</p>
                  <p className="activity-desc">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function statusLabel(status: CoupleInvite['status']): string {
  if (status === 'pending') return 'Đang chờ'
  if (status === 'accepted') return 'Đã xác nhận'
  if (status === 'cancelled') return 'Đã huỷ'
  return 'Hết hạn'
}

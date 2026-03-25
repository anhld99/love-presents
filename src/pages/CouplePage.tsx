import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { ComfortAlertResult, CoupleActivity, CoupleInvite, CoupleStatus } from '../lib/api'

interface CouplePageProps {
  hasCouple: boolean
  role: 'anh' | 'em' | null
  email: string | null
  latestComfortAlertAt: string | null
  hasUnreadComfortAlert: boolean
  onMarkComfortAlertSeen: (timestamp: string | null) => void
  onCreateCouple: (name: string) => Promise<void>
  onInviteEm: (email: string) => Promise<void>
  onSendComfortAlert: () => Promise<ComfortAlertResult>
  onSendComfortReply: () => Promise<void>
  onFetchCoupleStatus: () => Promise<CoupleStatus>
  onFetchInvites: () => Promise<CoupleInvite[]>
  onResendInvite: (inviteId: string) => Promise<void>
  onCancelInvite: (inviteId: string) => Promise<void>
  onFetchActivity: () => Promise<CoupleActivity[]>
}

export function CouplePage({
  hasCouple,
  role,
  email,
  latestComfortAlertAt,
  hasUnreadComfortAlert,
  onMarkComfortAlertSeen,
  onCreateCouple,
  onInviteEm,
  onSendComfortAlert,
  onSendComfortReply,
  onFetchCoupleStatus,
  onFetchInvites,
  onResendInvite,
  onCancelInvite,
  onFetchActivity,
}: CouplePageProps) {
  const [coupleName, setCoupleName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [loadingComfortAlert, setLoadingComfortAlert] = useState(false)
  const [loadingComfortReply, setLoadingComfortReply] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [comfortMessage, setComfortMessage] = useState('')
  const [comfortReplyMessage, setComfortReplyMessage] = useState('')
  const [comfortAlertCooldownUntil, setComfortAlertCooldownUntil] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [invites, setInvites] = useState<CoupleInvite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [inviteActionId, setInviteActionId] = useState('')

  const [activity, setActivity] = useState<CoupleActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [clockMs, setClockMs] = useState(() => Date.now())

  const comfortAlertRemainingSeconds = useMemo(() => {
    if (!comfortAlertCooldownUntil) return 0

    const remainingMs = new Date(comfortAlertCooldownUntil).getTime() - clockMs
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
  }, [comfortAlertCooldownUntil, clockMs])

  const comfortAlertOnCooldown = comfortAlertRemainingSeconds > 0

  useEffect(() => {
    if (role === 'anh' && latestComfortAlertAt) {
      onMarkComfortAlertSeen(latestComfortAlertAt)
    }
  }, [role, latestComfortAlertAt, onMarkComfortAlertSeen])

  useEffect(() => {
    if (!hasCouple) {
      setInvites([])
      setActivity([])
      setComfortAlertCooldownUntil(null)
      return
    }

    let alive = true

    async function run() {
      if (role === 'anh') {
        setInvitesLoading(true)
        setActivityLoading(true)
      }

      try {
        const [inviteList, activityList, coupleStatus] = await Promise.all([
          role === 'anh' ? onFetchInvites() : Promise.resolve(null),
          role === 'anh' ? onFetchActivity() : Promise.resolve(null),
          onFetchCoupleStatus(),
        ])

        if (alive) {
          if (inviteList) {
            setInvites(inviteList)
          }
          setActivity(activityList ?? [])
          setComfortAlertCooldownUntil(coupleStatus.comfortAlertCooldownUntil)
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
  }, [hasCouple, role, onFetchInvites, onFetchActivity, onFetchCoupleStatus])

  useEffect(() => {
    if (!comfortAlertCooldownUntil) return

    setClockMs(Date.now())
    const timer = window.setInterval(() => {
      setClockMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [comfortAlertCooldownUntil])

  useEffect(() => {
    if (comfortAlertCooldownUntil && !comfortAlertOnCooldown) {
      setComfortAlertCooldownUntil(null)
    }
  }, [comfortAlertCooldownUntil, comfortAlertOnCooldown])

  async function reloadInvites() {
    if (role !== 'anh') return
    const inviteList = await onFetchInvites()
    setInvites(inviteList)
  }

  async function reloadActivity() {
    if (role !== 'anh') return
    const activityList = await onFetchActivity()
    setActivity(activityList)
  }

  async function reloadCoupleStatus() {
    const coupleStatus = await onFetchCoupleStatus()
    setComfortAlertCooldownUntil(coupleStatus.comfortAlertCooldownUntil)
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

  async function handleSendComfortAlert() {
    setLoadingComfortAlert(true)
    setError('')
    setComfortMessage('')

    try {
      const result = await onSendComfortAlert()
      setComfortAlertCooldownUntil(result.comfortAlertCooldownUntil)
      setComfortMessage('Đã gửi email quan trọng cho anh rồi. Hy vọng anh sẽ dỗ bạn thật nhanh!')
      await reloadCoupleStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi tín hiệu cho anh')
      try {
        await reloadCoupleStatus()
      } catch {
        void 0
      }
    } finally {
      setLoadingComfortAlert(false)
    }
  }

  async function handleSendComfortReply() {
    setLoadingComfortReply(true)
    setError('')
    setComfortReplyMessage('')

    try {
      await onSendComfortReply()
      setComfortReplyMessage('Đã gửi lời nhắn cho em rồi. Hy vọng em sẽ mềm lòng hơn một chút!')
      await reloadActivity()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lời dỗ dành cho em')
    } finally {
      setLoadingComfortReply(false)
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

      {hasCouple && role === 'anh' && latestComfortAlertAt && (
        <div className={`alert alert-attention alert-spaced${hasUnreadComfortAlert ? ' unread' : ''}`}>
          {hasUnreadComfortAlert
            ? `Em vừa gửi tín hiệu cần được dỗ lúc ${formatDate(latestComfortAlertAt)}.`
            : `Tín hiệu gần nhất từ em được gửi lúc ${formatDate(latestComfortAlertAt)}.`}
        </div>
      )}

      {hasCouple && role === 'anh' && latestComfortAlertAt && (
        <div className="card couple-card">
          <h3>Phản hồi cho em</h3>
          <p className="page-subtitle">Gửi cho em một email trấn an để em biết anh đã nhận tín hiệu rồi.</p>
          {comfortReplyMessage && <div className="alert alert-success alert-spaced">{comfortReplyMessage}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={loadingComfortReply}
              onClick={() => {
                void handleSendComfortReply()
              }}
            >
              {loadingComfortReply ? 'Đang gửi lời dỗ dành...' : 'Anh đang tới dỗ em đây'}
            </button>
          </div>
        </div>
      )}

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
          <p className="page-subtitle">Bạn có thể thêm quà và gửi tín hiệu để anh biết là đến lúc phải dỗ em rồi.</p>
          {comfortMessage && <div className="alert alert-success alert-spaced">{comfortMessage}</div>}
          <p className="page-subtitle">
            {comfortAlertOnCooldown
              ? `Có thể gửi lại tín hiệu sau ${formatCountdown(comfortAlertRemainingSeconds)} nữa.`
              : 'Email sẽ được đánh dấu quan trọng để anh chú ý ngay.'}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={loadingComfortAlert || comfortAlertOnCooldown}
              onClick={() => {
                void handleSendComfortAlert()
              }}
            >
              {loadingComfortAlert
                ? 'Đang gửi email quan trọng...'
                : comfortAlertOnCooldown
                  ? `Chờ ${formatCountdown(comfortAlertRemainingSeconds)}`
                  : 'Em đang giận đấy, dỗ em đi'}
            </button>
          </div>
        </div>
      )}

      {hasCouple && role === 'anh' && (
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

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} giây`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

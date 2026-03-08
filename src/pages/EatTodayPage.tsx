import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { useToast } from '../components/useToast'
import { createFoodOption, deleteFoodOption, fetchFoodOptions } from '../lib/api'
import type { FoodOption, FoodPriceLevel } from '../types/food'

interface EatTodayPageProps {
  role: 'anh' | 'em' | null
}

const WHEEL_COLORS = ['#ffd6e4', '#ffe7c7', '#ffeef4', '#f5ddff', '#ffe2d8', '#fff0ca']
const MAX_WHEEL_LABELS = 12

export function EatTodayPage({ role }: EatTodayPageProps) {
  const { showToast } = useToast()
  const [options, setOptions] = useState<FoodOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [priceLevel, setPriceLevel] = useState<FoodPriceLevel>('binh_dan')
  const [spinning, setSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [result, setResult] = useState<FoodOption | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{ index: number, x: number, y: number } | null>(null)

  const [name, setName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [newPriceLevel, setNewPriceLevel] = useState<FoodPriceLevel>('binh_dan')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const spinTimeoutRef = useRef<number | null>(null)

  const isAnh = role === 'anh'

  const filtered = useMemo(() => {
    return options.filter(item => item.priceLevel === priceLevel)
  }, [options, priceLevel])

  const cheapCount = useMemo(() => options.filter(item => item.priceLevel === 'binh_dan').length, [options])
  const priceyCount = useMemo(() => options.filter(item => item.priceLevel === 'dat_do').length, [options])

  const wheelBackground = useMemo(() => {
    if (filtered.length === 0) {
      return 'conic-gradient(from 0deg, rgba(255,245,249,0.95), rgba(255,234,242,0.95))'
    }

    const slice = 360 / filtered.length
    const segments: string[] = []

    for (let idx = 0; idx < filtered.length; idx += 1) {
      const start = (idx * slice).toFixed(3)
      const end = ((idx + 1) * slice).toFixed(3)
      const color = WHEEL_COLORS[idx % WHEEL_COLORS.length]
      segments.push(`${color} ${start}deg ${end}deg`)
    }

    return `conic-gradient(from 0deg, ${segments.join(', ')})`
  }, [filtered])

  const wheelLabelIndexes = useMemo(() => {
    if (filtered.length === 0) return [] as number[]

    if (filtered.length <= MAX_WHEEL_LABELS) {
      return filtered.map((_, idx) => idx)
    }

    const sampled = new Set<number>()
    const step = filtered.length / MAX_WHEEL_LABELS

    for (let slot = 0; slot < MAX_WHEEL_LABELS; slot += 1) {
      const candidate = Math.floor(slot * step)
      sampled.add(Math.min(filtered.length - 1, candidate))
    }

    return [...sampled].sort((a, b) => a - b)
  }, [filtered])

  const wheelLabelIndexSet = useMemo(() => new Set(wheelLabelIndexes), [wheelLabelIndexes])

  const labelFontRem = useMemo(() => {
    if (filtered.length <= 6) return 0.78
    if (filtered.length <= 10) return 0.72
    if (filtered.length <= 16) return 0.66
    if (filtered.length <= 24) return 0.6
    return 0.54
  }, [filtered.length])

  const labelOffsetPx = useMemo(() => {
    if (filtered.length <= 8) return 114
    if (filtered.length <= 16) return 118
    return 121
  }, [filtered.length])

  const labelMaxChars = useMemo(() => {
    if (filtered.length <= 8) return 18
    if (filtered.length <= 14) return 14
    return 11
  }, [filtered.length])

  const hoveredOption = hoverInfo ? filtered[hoverInfo.index] : null
  const showHoverTooltip = !!hoverInfo
    && !!hoveredOption
    && (hoveredOption.name.length > labelMaxChars || !wheelLabelIndexSet.has(hoverInfo.index))

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchFoodOptions()
        if (!alive) return
        setOptions(data)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách món ăn')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      alive = false
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  async function handleAddOption(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !restaurantAddress.trim()) {
      showToast('Vui lòng nhập đầy đủ tên món và địa chỉ quán', 'error')
      return
    }

    setSaving(true)
    try {
      const created = await createFoodOption({
        name,
        restaurantAddress,
        priceLevel: newPriceLevel,
      })
      setOptions(prev => [created, ...prev])
      setName('')
      setRestaurantAddress('')
      setNewPriceLevel('binh_dan')
      showToast('Đã thêm món ăn mới!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm món ăn', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteOption(id: string) {
    setDeletingId(id)
    try {
      await deleteFoodOption(id)
      setOptions(prev => prev.filter(item => item.id !== id))
      setResult(prev => (prev?.id === id ? null : prev))
      showToast('Đã xoá món ăn')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá món ăn', 'error')
    } finally {
      setDeletingId('')
    }
  }

  function handleSpin() {
    if (spinning) return

    if (filtered.length === 0) {
      showToast(`Chưa có món ở mức ${labelLevel(priceLevel)} để quay`, 'error')
      return
    }

    const winnerIndex = Math.floor(Math.random() * filtered.length)
    const winner = filtered[winnerIndex]
    const slice = 360 / filtered.length
    const centerDeg = winnerIndex * slice + slice / 2

    setSpinning(true)
    setResult(null)

    const currentNormalized = ((wheelRotation % 360) + 360) % 360
    const targetOffset = (360 - centerDeg) % 360
    const delta = (targetOffset - currentNormalized + 360) % 360
    const extraTurns = 6 + Math.floor(Math.random() * 3)
    const finalRotation = wheelRotation + extraTurns * 360 + delta

    setWheelRotation(finalRotation)

    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current)
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false)
      setResult(winner)
      showToast(`Hôm nay ăn: ${winner.name}`)
    }, 4200)
  }

  function handleWheelMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (filtered.length === 0 || spinning) {
      if (hoverInfo) setHoverInfo(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const dx = x - centerX
    const dy = y - centerY
    const radius = rect.width / 2
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > radius || distance < radius * 0.18) {
      if (hoverInfo) setHoverInfo(null)
      return
    }

    const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360
    const slice = 360 / filtered.length
    const index = Math.min(filtered.length - 1, Math.floor(deg / slice))

    const clampedX = Math.max(22, Math.min(rect.width - 22, x))
    const clampedY = Math.max(22, Math.min(rect.height - 22, y))

    setHoverInfo({ index, x: clampedX, y: clampedY })
  }

  function handleWheelMouseLeave() {
    if (hoverInfo) setHoverInfo(null)
  }

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Lucky Food Wheel</p>
          <h1 className="page-title">Hôm nay ăn gì?</h1>
          <p className="page-subtitle">Vòng quay may mắn chọn món nhanh, đẹp và đúng mood của hai bạn.</p>
        </div>
      </section>

      <div className="card food-roulette-card">
        <div className="food-tier-switch">
          <button
            type="button"
            className={`food-tier-btn${priceLevel === 'binh_dan' ? ' active' : ''}`}
            onClick={() => setPriceLevel('binh_dan')}
            disabled={spinning}
          >
            Bình dân ({cheapCount})
          </button>
          <button
            type="button"
            className={`food-tier-btn${priceLevel === 'dat_do' ? ' active' : ''}`}
            onClick={() => setPriceLevel('dat_do')}
            disabled={spinning}
          >
            Đắt đỏ ({priceyCount})
          </button>
        </div>

        <div className="lucky-wheel-wrap">
          <div className="wheel-pointer" aria-hidden="true" />
          <div className="wheel-frame">
            <div
              className={`lucky-wheel${spinning ? ' spinning' : ''}`}
              style={{
                background: wheelBackground,
                transform: `rotate(${wheelRotation}deg)`,
              }}
              onMouseMove={handleWheelMouseMove}
              onMouseLeave={handleWheelMouseLeave}
            >
              {wheelLabelIndexes.map(itemIndex => {
                const item = filtered[itemIndex]
                const slice = 360 / filtered.length
                const centerDeg = itemIndex * slice + slice / 2
                const labelRotation = centerDeg > 90 && centerDeg < 270 ? centerDeg + 180 : centerDeg
                return (
                  <span
                    key={item.id}
                    className="wheel-label"
                    style={{
                      fontSize: `${labelFontRem}rem`,
                      transform: `translate(-50%, -50%) rotate(${labelRotation}deg) translateY(-${labelOffsetPx}px)`,
                    }}
                  >
                    {trimLabel(item.name, labelMaxChars)}
                  </span>
                )
              })}

              {showHoverTooltip && hoveredOption && (
                <div
                  className="wheel-tooltip"
                  style={{
                    left: `${hoverInfo.x}px`,
                    top: `${hoverInfo.y}px`,
                  }}
                >
                  {hoveredOption.name}
                </div>
              )}

              <div className="wheel-center">🍽️</div>
            </div>
          </div>
        </div>

        {filtered.length > MAX_WHEEL_LABELS && (
          <p className="roulette-sub wheel-note">
            Vòng quay có {filtered.length} món, đang hiển thị ngẫu nhiên {wheelLabelIndexes.length} nhãn để dễ nhìn.
          </p>
        )}

        <div className="roulette-panel">
          <p className="roulette-label">Đang quay mức: {labelLevel(priceLevel)}</p>
          <h2 className="roulette-title">{result?.name ?? (spinning ? 'Đang xoay thật mạnh...' : 'Sẵn sàng quay món?')}</h2>
          <p className="roulette-sub">
            {result ? result.restaurantAddress : filtered.length === 0 ? 'Thêm món ăn để bắt đầu vòng quay' : 'Bấm quay để chọn món ngẫu nhiên'}
          </p>
          {result && <p className="roulette-result">Chốt kèo: {result.name}</p>}
          <button type="button" className="btn btn-primary" onClick={handleSpin} disabled={spinning || loading}>
            {spinning ? 'Đang quay...' : 'Quay may mắn'}
          </button>
        </div>
      </div>

      {isAnh && (
        <div className="card food-manage-card">
          <h3>Thêm món ăn mới</h3>
          <p className="page-subtitle">Chỉ anh được cập nhật danh sách món cho vòng quay.</p>
          <form className="form-grid" onSubmit={e => { void handleAddOption(e) }}>
            <div className="form-group">
              <label className="form-label">Tên món</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Bún chả Hà Nội"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Địa chỉ quán</label>
              <input
                className="form-input"
                value={restaurantAddress}
                onChange={e => setRestaurantAddress(e.target.value)}
                placeholder="Số nhà, đường, quận"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mức giá</label>
              <div className="food-tier-switch">
                <button
                  type="button"
                  className={`food-tier-btn${newPriceLevel === 'binh_dan' ? ' active' : ''}`}
                  onClick={() => setNewPriceLevel('binh_dan')}
                >
                  Bình dân
                </button>
                <button
                  type="button"
                  className={`food-tier-btn${newPriceLevel === 'dat_do' ? ' active' : ''}`}
                  onClick={() => setNewPriceLevel('dat_do')}
                >
                  Đắt đỏ
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary form-submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Thêm món'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card food-manage-card">
        <h3>Danh sách món ăn</h3>
        <p className="page-subtitle">Tất cả món có trong vòng quay của couple.</p>

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && options.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🍜</div>
            <h3>Chưa có món ăn nào</h3>
            <p>{isAnh ? 'Hãy thêm món để bắt đầu vòng quay.' : 'Nhờ anh thêm món để có thể quay.'}</p>
          </div>
        )}

        {!loading && !error && options.length > 0 && (
          <div className="food-list">
            {options.map(item => (
              <div key={item.id} className="food-row">
                <div>
                  <p className="food-name">{item.name}</p>
                  <p className="food-address">{item.restaurantAddress}</p>
                </div>
                <div className="food-row-right">
                  <span className={`invite-status ${item.priceLevel === 'binh_dan' ? 'status-accepted' : 'status-pending'}`}>
                    {labelLevel(item.priceLevel)}
                  </span>
                  {isAnh && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={deletingId === item.id}
                      onClick={() => {
                        void handleDeleteOption(item.id)
                      }}
                    >
                      Xoá
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function labelLevel(level: FoodPriceLevel): string {
  return level === 'binh_dan' ? 'Bình dân' : 'Đắt đỏ'
}

function trimLabel(value: string, maxChars: number): string {
  return value.length > maxChars ? `${value.slice(0, maxChars)}…` : value
}

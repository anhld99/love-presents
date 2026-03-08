import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useToast } from '../components/useToast'
import { createFoodOption, deleteFoodOption, fetchFoodOptions } from '../lib/api'
import type { FoodOption, FoodPriceLevel } from '../types/food'

interface EatTodayPageProps {
  role: 'anh' | 'em' | null
}

export function EatTodayPage({ role }: EatTodayPageProps) {
  const { showToast } = useToast()
  const [options, setOptions] = useState<FoodOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [priceLevel, setPriceLevel] = useState<FoodPriceLevel>('binh_dan')
  const [spinning, setSpinning] = useState(false)
  const [preview, setPreview] = useState<FoodOption | null>(null)
  const [result, setResult] = useState<FoodOption | null>(null)

  const [name, setName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [newPriceLevel, setNewPriceLevel] = useState<FoodPriceLevel>('binh_dan')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const spinTimerRef = useRef<number | null>(null)

  const isAnh = role === 'anh'

  const filtered = useMemo(() => {
    return options.filter(item => item.priceLevel === priceLevel)
  }, [options, priceLevel])

  const cheapCount = useMemo(() => options.filter(item => item.priceLevel === 'binh_dan').length, [options])
  const priceyCount = useMemo(() => options.filter(item => item.priceLevel === 'dat_do').length, [options])

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
      if (spinTimerRef.current) {
        window.clearInterval(spinTimerRef.current)
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
      setResult(prev => prev?.id === id ? null : prev)
      setPreview(prev => prev?.id === id ? null : prev)
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

    if (spinTimerRef.current) {
      window.clearInterval(spinTimerRef.current)
      spinTimerRef.current = null
    }

    let tick = 0
    const maxTick = 24
    setSpinning(true)
    setResult(null)

    spinTimerRef.current = window.setInterval(() => {
      tick += 1
      const picked = filtered[Math.floor(Math.random() * filtered.length)]
      setPreview(picked)

      if (tick >= maxTick) {
        if (spinTimerRef.current) {
          window.clearInterval(spinTimerRef.current)
          spinTimerRef.current = null
        }
        const winner = filtered[Math.floor(Math.random() * filtered.length)]
        setPreview(winner)
        setResult(winner)
        setSpinning(false)
        showToast(`Hôm nay ăn: ${winner.name}`)
      }
    }, 90)
  }

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Food Roulette</p>
          <h1 className="page-title">Hôm nay ăn gì?</h1>
          <p className="page-subtitle">Chọn mức giá rồi quay để chốt món trong tích tắc.</p>
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
            Binh dan ({cheapCount})
          </button>
          <button
            type="button"
            className={`food-tier-btn${priceLevel === 'dat_do' ? ' active' : ''}`}
            onClick={() => setPriceLevel('dat_do')}
            disabled={spinning}
          >
            Dat do ({priceyCount})
          </button>
        </div>

        <div className={`roulette-panel${spinning ? ' spinning' : ''}`}>
          <p className="roulette-label">Muc dang quay: {labelLevel(priceLevel)}</p>
          <h2 className="roulette-title">{preview?.name ?? 'San sang quay mon?'}</h2>
          <p className="roulette-sub">{preview ? preview.restaurantAddress : 'Them mon an de bat dau vong quay'}</p>
          {result && (
            <p className="roulette-result">Chot keo: {result.name}</p>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSpin} disabled={spinning || loading}>
            {spinning ? 'Dang quay...' : 'Quay mon ngay'}
          </button>
        </div>
      </div>

      {isAnh && (
        <div className="card food-manage-card">
          <h3>Them mon an moi</h3>
          <p className="page-subtitle">Chi anh duoc cap nhat danh sach mon cho vong quay.</p>
          <form className="form-grid" onSubmit={e => { void handleAddOption(e) }}>
            <div className="form-group">
              <label className="form-label">Ten mon</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Vi du: Bun cha Ha Noi"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dia chi quan</label>
              <input
                className="form-input"
                value={restaurantAddress}
                onChange={e => setRestaurantAddress(e.target.value)}
                placeholder="So nha, duong, quan"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Muc gia</label>
              <div className="food-tier-switch">
                <button
                  type="button"
                  className={`food-tier-btn${newPriceLevel === 'binh_dan' ? ' active' : ''}`}
                  onClick={() => setNewPriceLevel('binh_dan')}
                >
                  Binh dan
                </button>
                <button
                  type="button"
                  className={`food-tier-btn${newPriceLevel === 'dat_do' ? ' active' : ''}`}
                  onClick={() => setNewPriceLevel('dat_do')}
                >
                  Dat do
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary form-submit" disabled={saving}>
                {saving ? 'Dang luu...' : 'Them mon'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card food-manage-card">
        <h3>Danh sach mon an</h3>
        <p className="page-subtitle">Tat ca mon co trong vong quay cua couple.</p>

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && options.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <h3>Chua co mon an nao</h3>
            <p>{isAnh ? 'Hay them mon de bat dau vong quay.' : 'Nho anh them mon de co the quay.'}</p>
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
                      Xoa
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
  return level === 'binh_dan' ? 'Binh dan' : 'Dat do'
}

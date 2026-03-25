import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFoodSpinHistory } from '../lib/api'
import type { FoodPriceLevel, FoodSpinHistoryItem } from '../types/food'

const PAGE_SIZE = 10

type FoodHistoryFilter = 'all' | FoodPriceLevel

export function FoodSpinHistoryPage() {
  const [history, setHistory] = useState<FoodSpinHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FoodHistoryFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const items = await fetchFoodSpinHistory()
        if (!alive) return
        setHistory(items)
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử quay món')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const cheapCount = useMemo(() => history.filter(item => item.priceLevel === 'binh_dan').length, [history])
  const priceyCount = useMemo(() => history.filter(item => item.priceLevel === 'dat_do').length, [history])

  const filtered = useMemo(() => {
    if (filter === 'all') return history
    return history.filter(item => item.priceLevel === filter)
  }, [history, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pagedItems = useMemo(() => {
    const from = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(from, from + PAGE_SIZE)
  }, [filtered, currentPage])

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Spin Journal</p>
          <h1 className="page-title">Lịch sử vòng quay</h1>
          <p className="page-subtitle">Lưu lại mọi lần quay để biết hôm nào hai bạn đã chốt món gì.</p>
        </div>
        <Link to="/eat" className="btn btn-primary hero-cta">
          Quay tiếp
        </Link>
      </section>

      {history.length > 0 && (
        <div className="summary-bar">
          <span className="summary-pill">
            Tổng lượt quay: <strong>{history.length}</strong>
          </span>
          <span className="summary-pill">
            Bình dân: <strong>{cheapCount}</strong>
          </span>
          <span className="summary-pill">
            Đắt đỏ: <strong>{priceyCount}</strong>
          </span>
        </div>
      )}

      <div className="card food-manage-card">
        <h3>Nhật ký quay món</h3>
        <p className="page-subtitle">Mỗi lần vòng quay chốt món sẽ được lưu lại ở đây.</p>

        <div className="food-tier-switch">
          <button
            type="button"
            className={`food-tier-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({history.length})
          </button>
          <button
            type="button"
            className={`food-tier-btn${filter === 'binh_dan' ? ' active' : ''}`}
            onClick={() => setFilter('binh_dan')}
          >
            Bình dân ({cheapCount})
          </button>
          <button
            type="button"
            className={`food-tier-btn${filter === 'dat_do' ? ' active' : ''}`}
            onClick={() => setFilter('dat_do')}
          >
            Đắt đỏ ({priceyCount})
          </button>
        </div>

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <h3>Chưa có lịch sử quay nào</h3>
            <p>Hãy quay món đầu tiên để bắt đầu lưu nhật ký ăn uống của hai bạn.</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔎</div>
            <h3>Chưa có lượt quay ở mức {labelLevel(filter)}</h3>
            <p>Thử đổi bộ lọc hoặc quay thêm để lưu lịch sử mới.</p>
          </div>
        )}

        {!loading && !error && pagedItems.length > 0 && (
          <div className="activity-list">
            {pagedItems.map(item => (
              <div key={item.id} className="activity-row">
                <p className="activity-title">{item.foodName}</p>
                <p className="activity-meta">{formatDate(item.spunAt)} • {labelLevel(item.priceLevel)}</p>
                <p className="activity-desc">{item.restaurantAddress}</p>
                <p className="activity-desc">
                  {item.spunByEmail ? `Quay bởi ${item.spunByEmail}` : 'Quay bởi một thành viên trong couple'}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div className="list-pagination">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={currentPage <= 1}
              onClick={() => {
                setPage(prev => Math.max(1, prev - 1))
              }}
            >
              Trước
            </button>
            <span className="pagination-meta">Trang {currentPage}/{totalPages}</span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setPage(prev => Math.min(totalPages, prev + 1))
              }}
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function labelLevel(level: FoodHistoryFilter): string {
  if (level === 'all') return 'tất cả mức'
  return level === 'binh_dan' ? 'Bình dân' : 'Đắt đỏ'
}

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GiftCard } from '../components/GiftCard'
import { Filters } from '../components/Filters'
import { useGifts } from '../hooks/useGiftsContext'
import { useToast } from '../components/useToast'
import type { GiftFilters, GiftFormData } from '../types/gift'

const DEFAULT_FILTERS: GiftFilters = {
  category: 'Tất cả',
  desireLevel: 'Tất cả',
  isGifted: 'Tất cả',
}

const DESIRE_SCORE: Record<string, number> = { 'Rất muốn': 3, 'Muốn': 2, 'Bình thường': 1 }

export function GiftListPage() {
  const { gifts, loading, error, toggleGifted, removeGift, editGift } = useGifts()
  const { showToast } = useToast()
  const [filters, setFilters] = useState<GiftFilters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    return gifts
      .filter(g => filters.category === 'Tất cả' || g.category === filters.category)
      .filter(g => filters.desireLevel === 'Tất cả' || g.desireLevel === filters.desireLevel)
      .filter(g => {
        if (filters.isGifted === 'Đã tặng') return g.isGifted
        if (filters.isGifted === 'Chưa tặng') return !g.isGifted
        return true
      })
      .sort((a, b) => {
        if (a.isGifted !== b.isGifted) return a.isGifted ? 1 : -1
        return (DESIRE_SCORE[b.desireLevel] ?? 0) - (DESIRE_SCORE[a.desireLevel] ?? 0)
      })
  }, [gifts, filters])

  const giftedCount = gifts.filter(g => g.isGifted).length

  async function handleToggle(id: string, isGifted: boolean) {
    try {
      await toggleGifted(id, isGifted)
      showToast(isGifted ? 'Đã đánh dấu là đã tặng!' : 'Đã bỏ đánh dấu')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật', 'error')
      throw err
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeGift(id)
      showToast('Đã xoá khỏi danh sách')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá', 'error')
      throw err
    }
  }

  async function handleEdit(id: string, data: GiftFormData) {
    try {
      await editGift(id, data)
      showToast('Đã lưu thay đổi!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể lưu', 'error')
      throw err
    }
  }

  return (
    <main className="page">
      <section className="page-hero">
        <div>
          <p className="page-kicker">Wishbook</p>
          <h1 className="page-title">Danh sách quà</h1>
          <p className="page-subtitle">Lưu lại những điều nhỏ xinh để mỗi dịp đặc biệt đều thật ý nghĩa.</p>
        </div>
        <Link to="/add" className="btn btn-primary hero-cta">
          + Thêm quà mới
        </Link>
      </section>

      {gifts.length > 0 && (
        <div className="summary-bar">
          <span className="summary-pill">
            Tổng: <strong>{gifts.length}</strong> món
          </span>
          <span className="summary-pill">
            Đã tặng: <strong>{giftedCount}</strong>
          </span>
          <span className="summary-pill">
            Chưa tặng: <strong>{gifts.length - giftedCount}</strong>
          </span>
        </div>
      )}

      <Filters filters={filters} onChange={setFilters} />

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {!loading && !error && gifts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <h3>Chưa có quà nào trong danh sách</h3>
          <p>Hãy thêm những món quà bạn mơ ước nhé!</p>
          <Link to="/add" className="btn btn-primary btn-inline">
            Thêm quà đầu tiên
          </Link>
        </div>
      )}

      {!loading && !error && gifts.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Không có quà nào khớp với bộ lọc</h3>
          <p>Thử thay đổi bộ lọc để xem thêm quà.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="gift-list">
          {filtered.map(gift => (
            <GiftCard
              key={gift.id}
              gift={gift}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </main>
  )
}

import { useState } from 'react'
import type { GiftItem, GiftFormData } from '../types/gift'
import { GiftForm } from './GiftForm'

interface GiftCardProps {
  gift: GiftItem
  onToggle: (id: string, isGifted: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, data: GiftFormData) => Promise<void>
}

const DESIRE_CLASS: Record<string, string> = {
  'Rất muốn': 'badge-desire-high',
  'Muốn': 'badge-desire-mid',
  'Bình thường': 'badge-desire-low',
}

const DESIRE_EMOJI: Record<string, string> = {
  'Rất muốn': '🔥',
  'Muốn': '✨',
  'Bình thường': '💭',
}

export function GiftCard({ gift, onToggle, onDelete, onEdit }: GiftCardProps) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    try {
      await onToggle(gift.id, !gift.isGifted)
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Xoá "${gift.name}" khỏi danh sách?`)) return
    setDeleting(true)
    try {
      await onDelete(gift.id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleEdit(data: GiftFormData) {
    await onEdit(gift.id, data)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="card">
        <div style={{ marginBottom: 16, fontWeight: 600, color: 'var(--gray-700)' }}>
          Chỉnh sửa quà
        </div>
        <GiftForm
          initialData={{
            name: gift.name,
            category: gift.category,
            budgetRange: gift.budgetRange,
            desireLevel: gift.desireLevel,
            sampleUrl: gift.sampleUrl,
          }}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          submitLabel="Lưu thay đổi"
        />
      </div>
    )
  }

  return (
    <div className={`gift-card${gift.isGifted ? ' gifted' : ''}`}>
      <div className="gift-checkbox-wrap">
        <input
          type="checkbox"
          className="gift-checkbox"
          checked={gift.isGifted}
          onChange={() => { void handleToggle() }}
          disabled={toggling}
          title={gift.isGifted ? 'Đánh dấu chưa tặng' : 'Đánh dấu đã tặng'}
        />
      </div>

      <div className="gift-body">
        <div className="gift-name">{gift.name}</div>

        <div className="gift-meta">
          <span className="badge badge-category">{gift.category}</span>
          <span className="badge badge-budget">{gift.budgetRange}</span>
          <span className={`badge ${DESIRE_CLASS[gift.desireLevel] ?? 'badge-desire-low'}`}>
            {DESIRE_EMOJI[gift.desireLevel]} {gift.desireLevel}
          </span>
          {gift.isGifted && <span className="badge badge-gifted">Đã tặng</span>}
        </div>

        {gift.sampleUrl && (
          <a
            className="gift-link"
            href={gift.sampleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem sản phẩm mẫu &rarr;
          </a>
        )}

        <div className="gift-actions">
          <button className="icon-btn" onClick={() => setEditing(true)}>
            Sửa
          </button>
          <button
            className="icon-btn danger"
            onClick={() => { void handleDelete() }}
            disabled={deleting}
          >
            {deleting ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  )
}

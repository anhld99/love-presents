import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GiftForm } from '../components/GiftForm'
import { useGifts } from '../hooks/useGifts'
import { useToast } from '../components/ToastProvider'
import type { GiftFormData } from '../types/gift'

export function AddGiftPage() {
  const { addGift } = useGifts()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)

  async function handleSubmit(data: GiftFormData) {
    try {
      await addGift(data)
      setSuccess(true)
      showToast('Đã thêm quà vào danh sách!')
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm quà', 'error')
      throw err
    }
  }

  return (
    <main className="page">
      <section className="page-hero page-hero-compact">
        <div>
          <p className="page-kicker">Dream Collector</p>
          <h1 className="page-title">Thêm quà mong muốn</h1>
          <p className="page-subtitle">Viết thật cụ thể để người thương hiểu đúng điều bạn thích.</p>
        </div>
      </section>

      {success && (
        <div className="alert alert-success alert-spaced">
          Đã thêm vào danh sách! Bạn có thể tiếp tục thêm quà khác.
        </div>
      )}

      <div className="card">
        <GiftForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/gifts')}
          submitLabel="Thêm vào danh sách"
        />
      </div>
    </main>
  )
}

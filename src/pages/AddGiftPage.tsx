import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GiftForm } from '../components/GiftForm'
import { useGifts } from '../hooks/useGiftsContext'
import { useToast } from '../components/useToast'
import type { GiftFormData } from '../types/gift'

const CONFETTI_CLASSES = [
  'confetti-1', 'confetti-2', 'confetti-3', 'confetti-4', 'confetti-5', 'confetti-6',
  'confetti-7', 'confetti-8', 'confetti-9', 'confetti-10', 'confetti-11', 'confetti-12',
]

export function AddGiftPage() {
  const { addGift } = useGifts()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [burstKey, setBurstKey] = useState(0)

  async function handleSubmit(data: GiftFormData) {
    try {
      await addGift(data)
      setSuccess(true)
      setBurstKey(prev => prev + 1)
      showToast('Đã thêm quà vào danh sách!')
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm quà', 'error')
      throw err
    }
  }

  return (
    <>
      {burstKey > 0 && (
        <div className="confetti-stage" key={`burst-${burstKey}`} aria-hidden="true">
          {CONFETTI_CLASSES.map(cls => (
            <span key={`${burstKey}-${cls}`} className={`confetti ${cls}`} />
          ))}
        </div>
      )}

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
    </>
  )
}

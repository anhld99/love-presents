import { useState } from 'react'
import type { GiftFormData, Category, BudgetRange, DesireLevel } from '../types/gift'

const CATEGORIES: Category[] = [
  'Thời trang', 'Phụ kiện', 'Làm đẹp & Chăm sóc', 'Sách',
  'Đồ ăn & Đồ uống', 'Du lịch & Trải nghiệm', 'Công nghệ',
  'Nhà cửa & Trang trí', 'Khác',
]

const BUDGET_RANGES: BudgetRange[] = [
  'Dưới 200k', '200k - 500k', '500k - 1 triệu', '1 - 3 triệu', 'Trên 3 triệu',
]

const DESIRE_LEVELS: { value: DesireLevel; emoji: string }[] = [
  { value: 'Rất muốn', emoji: '🔥' },
  { value: 'Muốn', emoji: '✨' },
  { value: 'Bình thường', emoji: '💭' },
]

interface FormErrors {
  name?: string
  category?: string
  budgetRange?: string
  desireLevel?: string
  sampleUrl?: string
}

interface GiftFormProps {
  initialData?: GiftFormData
  onSubmit: (data: GiftFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const EMPTY: GiftFormData = {
  name: '',
  category: 'Thời trang',
  budgetRange: '200k - 500k',
  desireLevel: 'Muốn',
  sampleUrl: '',
}

export function GiftForm({ initialData, onSubmit, onCancel, submitLabel = 'Thêm quà' }: GiftFormProps) {
  const [form, setForm] = useState<GiftFormData>(initialData ?? EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function set<K extends keyof GiftFormData>(key: K, value: GiftFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên quà'
    if (!form.category) e.category = 'Vui lòng chọn danh mục'
    if (!form.budgetRange) e.budgetRange = 'Vui lòng chọn tầm giá'
    if (!form.desireLevel) e.desireLevel = 'Vui lòng chọn mức độ mong muốn'
    if (form.sampleUrl && !/^https?:\/\/.+/.test(form.sampleUrl.trim())) {
      e.sampleUrl = 'Link phải bắt đầu bằng http:// hoặc https://'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({ ...form, name: form.name.trim(), sampleUrl: form.sampleUrl.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-grid" onSubmit={e => { void handleSubmit(e) }}>
      {/* Tên quà */}
      <div className="form-group">
        <label className="form-label">
          Tên quà <span className="required">*</span>
        </label>
        <input
          className={`form-input${errors.name ? ' error' : ''}`}
          placeholder="Ví dụ: Túi xách da thật màu nâu"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          maxLength={200}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      {/* Danh mục */}
      <div className="form-group">
        <label className="form-label">
          Danh mục <span className="required">*</span>
        </label>
        <select
          className={`form-select${errors.category ? ' error' : ''}`}
          value={form.category}
          onChange={e => set('category', e.target.value as Category)}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <span className="form-error">{errors.category}</span>}
      </div>

      {/* Tầm giá */}
      <div className="form-group">
        <label className="form-label">
          Tầm giá <span className="required">*</span>
        </label>
        <select
          className={`form-select${errors.budgetRange ? ' error' : ''}`}
          value={form.budgetRange}
          onChange={e => set('budgetRange', e.target.value as BudgetRange)}
        >
          {BUDGET_RANGES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.budgetRange && <span className="form-error">{errors.budgetRange}</span>}
      </div>

      {/* Mức độ mong muốn */}
      <div className="form-group">
        <label className="form-label">
          Mức độ mong muốn <span className="required">*</span>
        </label>
        <div className="desire-group">
          {DESIRE_LEVELS.map(({ value, emoji }) => (
            <label key={value} className="desire-item">
              <input
                type="radio"
                name="desireLevel"
                className="desire-option"
                value={value}
                checked={form.desireLevel === value}
                onChange={() => set('desireLevel', value)}
              />
              <span className="desire-label">{emoji} {value}</span>
            </label>
          ))}
        </div>
        {errors.desireLevel && <span className="form-error">{errors.desireLevel}</span>}
      </div>

      {/* Link sản phẩm mẫu */}
      <div className="form-group">
        <label className="form-label">Link sản phẩm mẫu</label>
        <input
          className={`form-input${errors.sampleUrl ? ' error' : ''}`}
          placeholder="https://..."
          value={form.sampleUrl}
          onChange={e => set('sampleUrl', e.target.value)}
          type="url"
        />
        {errors.sampleUrl && <span className="form-error">{errors.sampleUrl}</span>}
      </div>

      {/* Actions */}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Huỷ
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary form-submit"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

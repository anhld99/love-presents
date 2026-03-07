import type { GiftFilters, Category, DesireLevel } from '../types/gift'

const CATEGORIES: (Category | 'Tất cả')[] = [
  'Tất cả', 'Thời trang', 'Phụ kiện', 'Làm đẹp & Chăm sóc', 'Sách',
  'Đồ ăn & Đồ uống', 'Du lịch & Trải nghiệm', 'Công nghệ',
  'Nhà cửa & Trang trí', 'Khác',
]

const DESIRE_LEVELS: (DesireLevel | 'Tất cả')[] = ['Tất cả', 'Rất muốn', 'Muốn', 'Bình thường']

interface FiltersProps {
  filters: GiftFilters
  onChange: (f: GiftFilters) => void
}

export function Filters({ filters, onChange }: FiltersProps) {
  function set<K extends keyof GiftFilters>(key: K, value: GiftFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="filters">
      <select
        className="filter-select"
        value={filters.category}
        onChange={e => set('category', e.target.value as GiftFilters['category'])}
      >
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c === 'Tất cả' ? 'Tất cả danh mục' : c}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.desireLevel}
        onChange={e => set('desireLevel', e.target.value as GiftFilters['desireLevel'])}
      >
        {DESIRE_LEVELS.map(d => (
          <option key={d} value={d}>{d === 'Tất cả' ? 'Mọi mức độ' : d}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.isGifted}
        onChange={e => set('isGifted', e.target.value as GiftFilters['isGifted'])}
      >
        <option value="Tất cả">Tất cả trạng thái</option>
        <option value="Chưa tặng">Chưa tặng</option>
        <option value="Đã tặng">Đã tặng</option>
      </select>
    </div>
  )
}

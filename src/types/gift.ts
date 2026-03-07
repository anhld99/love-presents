export type DesireLevel = 'Rất muốn' | 'Muốn' | 'Bình thường'

export type BudgetRange = 'Dưới 200k' | '200k - 500k' | '500k - 1 triệu' | '1 - 3 triệu' | 'Trên 3 triệu'

export type Category =
  | 'Thời trang'
  | 'Phụ kiện'
  | 'Làm đẹp & Chăm sóc'
  | 'Sách'
  | 'Đồ ăn & Đồ uống'
  | 'Du lịch & Trải nghiệm'
  | 'Công nghệ'
  | 'Nhà cửa & Trang trí'
  | 'Khác'

export interface GiftItem {
  id: string
  name: string
  category: Category
  budgetRange: BudgetRange
  desireLevel: DesireLevel
  sampleUrl: string
  isGifted: boolean
  createdAt: string
  updatedAt: string
}

export type GiftFormData = Omit<GiftItem, 'id' | 'isGifted' | 'createdAt' | 'updatedAt'>

export interface GiftFilters {
  category: Category | 'Tất cả'
  desireLevel: DesireLevel | 'Tất cả'
  isGifted: 'Tất cả' | 'Đã tặng' | 'Chưa tặng'
}

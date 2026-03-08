export type FoodPriceLevel = 'binh_dan' | 'dat_do'

export interface FoodOption {
  id: string
  name: string
  restaurantAddress: string
  priceLevel: FoodPriceLevel
  createdAt: string
  updatedAt: string
}

export interface FoodOptionFormData {
  name: string
  restaurantAddress: string
  priceLevel: FoodPriceLevel
}

export type FoodPriceLevel = 'binh_dan' | 'dat_do'

export interface FoodOption {
  id: string
  name: string
  restaurantAddress: string
  priceLevel: FoodPriceLevel
  createdByEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface FoodOptionFormData {
  name: string
  restaurantAddress: string
  priceLevel: FoodPriceLevel
}

export interface FoodSpinPayload {
  optionId: string
}

export interface FoodSpinHistoryItem {
  id: string
  foodOptionId: string | null
  foodName: string
  restaurantAddress: string
  priceLevel: FoodPriceLevel
  spunAt: string
  spunByEmail: string | null
}

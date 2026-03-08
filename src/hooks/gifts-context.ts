import { createContext } from 'react'
import type { GiftItem, GiftFormData } from '../types/gift'

export interface GiftsCtx {
  gifts: GiftItem[]
  loading: boolean
  error: string | null
  addGift: (data: GiftFormData) => Promise<void>
  toggleGifted: (id: string, isGifted: boolean) => Promise<void>
  removeGift: (id: string) => Promise<void>
  editGift: (id: string, data: GiftFormData) => Promise<void>
  refresh: () => Promise<void>
}

export const GiftsContext = createContext<GiftsCtx | null>(null)

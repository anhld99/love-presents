import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { GiftItem, GiftFormData } from '../types/gift'
import { fetchGifts, createGift, updateGift, deleteGift } from '../lib/api'

interface GiftsCtx {
  gifts: GiftItem[]
  loading: boolean
  error: string | null
  addGift: (data: GiftFormData) => Promise<void>
  toggleGifted: (id: string, isGifted: boolean) => Promise<void>
  removeGift: (id: string) => Promise<void>
  editGift: (id: string, data: GiftFormData) => Promise<void>
  refresh: () => Promise<void>
}

const GiftsContext = createContext<GiftsCtx | null>(null)

export function GiftsProvider({ children }: { children: ReactNode }) {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchGifts()
      setGifts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách quà')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const addGift = useCallback(async (data: GiftFormData) => {
    const newGift = await createGift(data)
    setGifts(prev => [newGift, ...prev])
  }, [])

  const toggleGifted = useCallback(async (id: string, isGifted: boolean) => {
    const updated = await updateGift(id, { isGifted })
    setGifts(prev => prev.map(g => (g.id === id ? updated : g)))
  }, [])

  const removeGift = useCallback(async (id: string) => {
    await deleteGift(id)
    setGifts(prev => prev.filter(g => g.id !== id))
  }, [])

  const editGift = useCallback(async (id: string, data: GiftFormData) => {
    const updated = await updateGift(id, data)
    setGifts(prev => prev.map(g => (g.id === id ? updated : g)))
  }, [])

  return (
    <GiftsContext.Provider value={{ gifts, loading, error, addGift, toggleGifted, removeGift, editGift, refresh: load }}>
      {children}
    </GiftsContext.Provider>
  )
}

export function useGifts(): GiftsCtx {
  const ctx = useContext(GiftsContext)
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider')
  return ctx
}

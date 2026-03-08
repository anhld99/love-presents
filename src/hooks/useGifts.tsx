import { useState, useEffect, useCallback, type ReactNode } from 'react'
import type { GiftItem, GiftFormData } from '../types/gift'
import { fetchGifts, createGift, updateGift, deleteGift } from '../lib/api'
import { GiftsContext } from './gifts-context'

interface GiftsProviderProps {
  children: ReactNode
  canReadList?: boolean
}

export function GiftsProvider({ children, canReadList = true }: GiftsProviderProps) {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(canReadList)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!canReadList) {
      setGifts([])
      setError(null)
      setLoading(false)
      return
    }

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
  }, [canReadList])

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

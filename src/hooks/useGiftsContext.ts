import { useContext } from 'react'
import { GiftsContext } from './gifts-context'

export function useGifts() {
  const ctx = useContext(GiftsContext)
  if (!ctx) throw new Error('useGifts must be used inside GiftsProvider')
  return ctx
}

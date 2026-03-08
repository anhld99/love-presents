import { createContext } from 'react'

export interface ToastCtx {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export const ToastContext = createContext<ToastCtx | null>(null)

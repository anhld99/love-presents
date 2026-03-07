import type { GiftItem, GiftFormData } from '../types/gift'

const BASE = '/api/gifts'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Đã xảy ra lỗi')
  return json as T
}

export async function fetchGifts(): Promise<GiftItem[]> {
  return request<GiftItem[]>(BASE)
}

export async function createGift(data: GiftFormData): Promise<GiftItem> {
  return request<GiftItem>(BASE, { method: 'POST', body: JSON.stringify(data) })
}

export async function updateGift(id: string, data: Partial<GiftItem>): Promise<GiftItem> {
  return request<GiftItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteGift(id: string): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function login(password: string): Promise<void> {
  return request<void>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export async function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' })
}

export async function checkSession(): Promise<boolean> {
  try {
    await request<void>('/api/auth/session')
    return true
  } catch {
    return false
  }
}

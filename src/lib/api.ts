import type { GiftItem, GiftFormData } from '../types/gift'
import type { FoodOption, FoodOptionFormData, FoodSpinHistoryItem, FoodSpinPayload } from '../types/food'

const BASE = '/api/gifts'
const FOOD_BASE = '/api/foods'
const FOOD_HISTORY_BASE = '/api/foods/history'
const USE_MOCK_DATA = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true'
const MOCK_STORAGE_KEY = 'love-presents:mock-gifts'
const MOCK_FOOD_STORAGE_KEY = 'love-presents:mock-food-options'
const MOCK_FOOD_HISTORY_STORAGE_KEY = 'love-presents:mock-food-spin-history'
const MOCK_COMFORT_ALERT_KEY = 'love-presents:mock-comfort-alert-at'
const COMFORT_ALERT_COOLDOWN_MS = 1000 * 60 * 30

export type UserRole = 'anh' | 'em'

interface SessionPayload {
  ok: boolean
  role?: UserRole | null
  hasCouple?: boolean
  email?: string
}

interface PaginationPayload {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
}

export interface SessionState {
  authenticated: boolean
  role: UserRole | null
  hasCouple: boolean
  email: string | null
}

export interface CoupleInvite {
  id: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

export interface CoupleActivity {
  id: string
  type: 'couple_created' | 'invite_sent' | 'invite_accepted' | 'gift_added' | 'food_spun' | 'comfort_alert_sent'
  at: string
  title: string
  description: string
}

export interface CoupleStatus {
  email: string | null
  role: UserRole | null
  hasCouple: boolean
  comfortAlertCooldownUntil: string | null
}

export interface ComfortAlertResult {
  comfortAlertCooldownUntil: string | null
}

const MOCK_SEED_GIFTS: GiftItem[] = [
  {
    id: 'mock-1',
    name: 'Nến thơm phòng ngủ',
    category: 'Nhà cửa & Trang trí',
    budgetRange: '200k - 500k',
    desireLevel: 'Muốn',
    sampleUrl: 'https://example.com/candle',
    isGifted: false,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-01-05T10:00:00.000Z',
  },
  {
    id: 'mock-2',
    name: 'Túi tote đi chơi',
    category: 'Thời trang',
    budgetRange: '500k - 1 triệu',
    desireLevel: 'Rất muốn',
    sampleUrl: 'https://example.com/tote',
    isGifted: true,
    createdAt: '2026-01-02T09:00:00.000Z',
    updatedAt: '2026-01-10T18:20:00.000Z',
  },
]

const MOCK_SEED_FOODS: FoodOption[] = [
  {
    id: 'food-1',
    name: 'Bun bo',
    restaurantAddress: '215 Nguyen Trai, Q1',
    priceLevel: 'binh_dan',
    createdByEmail: 'mock@example.com',
    createdAt: '2026-02-11T09:00:00.000Z',
    updatedAt: '2026-02-11T09:00:00.000Z',
  },
  {
    id: 'food-2',
    name: 'Sushi omakase mini',
    restaurantAddress: '52 Le Loi, Q1',
    priceLevel: 'dat_do',
    createdByEmail: 'mock@example.com',
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso(): string {
  return new Date().toISOString()
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mock-${Math.random().toString(36).slice(2, 10)}`
}

function readMockGifts(): GiftItem[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY)
  if (!raw) {
    const seed = clone(MOCK_SEED_GIFTS)
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Invalid mock data')
    return parsed as GiftItem[]
  } catch {
    const seed = clone(MOCK_SEED_GIFTS)
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeMockGifts(gifts: GiftItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(gifts))
}

function readMockFoods(): FoodOption[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(MOCK_FOOD_STORAGE_KEY)
  if (!raw) {
    const seed = clone(MOCK_SEED_FOODS)
    window.localStorage.setItem(MOCK_FOOD_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Invalid mock food data')
    return parsed as FoodOption[]
  } catch {
    const seed = clone(MOCK_SEED_FOODS)
    window.localStorage.setItem(MOCK_FOOD_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function writeMockFoods(options: FoodOption[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_FOOD_STORAGE_KEY, JSON.stringify(options))
}

function readMockFoodHistory(): FoodSpinHistoryItem[] {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(MOCK_FOOD_HISTORY_STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Invalid mock food history data')
    return parsed as FoodSpinHistoryItem[]
  } catch {
    window.localStorage.removeItem(MOCK_FOOD_HISTORY_STORAGE_KEY)
    return []
  }
}

function writeMockFoodHistory(history: FoodSpinHistoryItem[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_FOOD_HISTORY_STORAGE_KEY, JSON.stringify(history))
}

function readMockComfortAlertAt(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(MOCK_COMFORT_ALERT_KEY)
}

function writeMockComfortAlertAt(value: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOCK_COMFORT_ALERT_KEY, value)
}

function toCooldownUntil(createdAt: string): string | null {
  if (!createdAt) return null

  const cooldownUntil = new Date(new Date(createdAt).getTime() + COMFORT_ALERT_COOLDOWN_MS)
  return cooldownUntil.getTime() > Date.now() ? cooldownUntil.toISOString() : null
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  let payload: unknown = null
  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    if (res.status === 404 && url.startsWith('/api/')) {
      throw new Error('Không thấy API. Nếu chạy local, hãy dùng `vercel dev` thay vì `npm run dev`.')
    }
    throw new Error((payload as { error?: string } | null)?.error ?? `Yêu cầu thất bại (${res.status})`)
  }

  return payload as T
}

async function fetchAllPages<T>(url: string, key?: string): Promise<T[]> {
  const pageSize = 50
  const all: T[] = []
  let page = 1

  while (page <= 200) {
    const separator = url.includes('?') ? '&' : '?'
    const payload = await request<unknown>(`${url}${separator}page=${page}&pageSize=${pageSize}`)
    const items = extractArray<T>(payload, key)
    all.push(...items)

    const pagination = extractPagination(payload)
    if (!pagination || !pagination.hasNext) {
      break
    }

    page += 1
  }

  return all
}

function extractArray<T>(payload: unknown, key?: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.items)) {
    return record.items as T[]
  }

  if (key && Array.isArray(record[key])) {
    return record[key] as T[]
  }

  return []
}

function extractPagination(payload: unknown): PaginationPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const pagination = (payload as { pagination?: unknown }).pagination
  if (!pagination || typeof pagination !== 'object') {
    return null
  }

  const value = pagination as Partial<PaginationPayload>
  if (
    typeof value.page !== 'number'
    || typeof value.pageSize !== 'number'
    || typeof value.total !== 'number'
    || typeof value.totalPages !== 'number'
    || typeof value.hasNext !== 'boolean'
  ) {
    return null
  }

  return value as PaginationPayload
}

export async function fetchGifts(): Promise<GiftItem[]> {
  if (USE_MOCK_DATA) {
    const gifts = readMockGifts()
    return gifts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return fetchAllPages<GiftItem>(BASE)
}

export async function createGift(data: GiftFormData): Promise<GiftItem> {
  if (USE_MOCK_DATA) {
    const gifts = readMockGifts()
    const timestamp = nowIso()
    const gift: GiftItem = {
      id: randomId(),
      name: data.name,
      category: data.category,
      budgetRange: data.budgetRange,
      desireLevel: data.desireLevel,
      sampleUrl: data.sampleUrl,
      isGifted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    writeMockGifts([gift, ...gifts])
    return gift
  }

  return request<GiftItem>(BASE, { method: 'POST', body: JSON.stringify(data) })
}

export async function updateGift(id: string, data: Partial<GiftItem>): Promise<GiftItem> {
  if (USE_MOCK_DATA) {
    const gifts = readMockGifts()
    const idx = gifts.findIndex(g => g.id === id)
    if (idx === -1) throw new Error('Không tìm thấy quà để cập nhật')

    const updated: GiftItem = {
      ...gifts[idx],
      ...data,
      updatedAt: nowIso(),
    }
    gifts[idx] = updated
    writeMockGifts(gifts)
    return updated
  }

  return request<GiftItem>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteGift(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    const gifts = readMockGifts()
    const next = gifts.filter(g => g.id !== id)
    if (next.length === gifts.length) throw new Error('Không tìm thấy quà để xoá')
    writeMockGifts(next)
    return
  }

  return request<void>(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function fetchFoodOptions(): Promise<FoodOption[]> {
  if (USE_MOCK_DATA) {
    const options = readMockFoods()
    return options.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return fetchAllPages<FoodOption>(FOOD_BASE)
}

export async function createFoodOption(data: FoodOptionFormData): Promise<FoodOption> {
  if (USE_MOCK_DATA) {
    const options = readMockFoods()
    const timestamp = nowIso()
    const item: FoodOption = {
      id: randomId(),
      name: data.name.trim(),
      restaurantAddress: data.restaurantAddress.trim(),
      priceLevel: data.priceLevel,
      createdByEmail: 'mock@example.com',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    writeMockFoods([item, ...options])
    return item
  }

  return request<FoodOption>(FOOD_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteFoodOption(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    const options = readMockFoods()
    const next = options.filter(item => item.id !== id)
    if (next.length === options.length) throw new Error('Không tìm thấy món ăn để xoá')
    writeMockFoods(next)
    return
  }

  return request<void>(`${FOOD_BASE}/${id}`, { method: 'DELETE' })
}

export async function fetchFoodSpinHistory(): Promise<FoodSpinHistoryItem[]> {
  if (USE_MOCK_DATA) {
    const history = readMockFoodHistory()
    return history.sort((a, b) => b.spunAt.localeCompare(a.spunAt))
  }

  return fetchAllPages<FoodSpinHistoryItem>(FOOD_HISTORY_BASE)
}

export async function recordFoodSpin(data: FoodSpinPayload): Promise<FoodSpinHistoryItem> {
  if (USE_MOCK_DATA) {
    const options = readMockFoods()
    const winner = options.find(option => option.id === data.optionId)
    if (!winner) {
      throw new Error('Không tìm thấy món ăn để lưu lịch sử quay')
    }

    const item: FoodSpinHistoryItem = {
      id: randomId(),
      foodOptionId: winner.id,
      foodName: winner.name,
      restaurantAddress: winner.restaurantAddress,
      priceLevel: winner.priceLevel,
      spunAt: nowIso(),
      spunByEmail: 'mock@example.com',
    }

    writeMockFoodHistory([item, ...readMockFoodHistory()])
    return item
  }

  return request<FoodSpinHistoryItem>(FOOD_HISTORY_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function completeGoogleLogin(accessToken: string): Promise<SessionState> {
  if (USE_MOCK_DATA) {
    return {
      authenticated: true,
      role: 'anh',
      hasCouple: true,
      email: 'mock@example.com',
    }
  }

  const payload = await request<SessionPayload>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  })

  return {
    authenticated: true,
    role: payload.role ?? null,
    hasCouple: payload.hasCouple ?? false,
    email: payload.email ?? null,
  }
}

export async function logout(): Promise<void> {
  if (USE_MOCK_DATA) return

  return request<void>('/api/auth/logout', { method: 'POST' })
}

export async function checkSession(): Promise<SessionState> {
  if (USE_MOCK_DATA) {
    return {
      authenticated: true,
      role: 'anh',
      hasCouple: true,
      email: 'mock@example.com',
    }
  }

  try {
    const payload = await request<SessionPayload>('/api/auth/session')
    return {
      authenticated: true,
      role: payload.role ?? null,
      hasCouple: payload.hasCouple ?? false,
      email: payload.email ?? null,
    }
  } catch {
    return {
      authenticated: false,
      role: null,
      hasCouple: false,
      email: null,
    }
  }
}

export async function createCouple(name: string): Promise<void> {
  if (USE_MOCK_DATA) return

  await request<void>('/api/couple', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function fetchCoupleStatus(): Promise<CoupleStatus> {
  if (USE_MOCK_DATA) {
    return {
      email: 'mock@example.com',
      role: 'anh',
      hasCouple: true,
      comfortAlertCooldownUntil: toCooldownUntil(readMockComfortAlertAt() ?? ''),
    }
  }

  return request<CoupleStatus>('/api/couple')
}

export async function sendComfortAlert(): Promise<ComfortAlertResult> {
  if (USE_MOCK_DATA) {
    const createdAt = nowIso()
    writeMockComfortAlertAt(createdAt)
    return {
      comfortAlertCooldownUntil: toCooldownUntil(createdAt),
    }
  }

  return request<ComfortAlertResult>('/api/couple', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'comfort-alert' }),
  })
}

export async function sendCoupleInvite(email: string): Promise<void> {
  if (USE_MOCK_DATA) return

  await request<void>('/api/couple/invite', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function acceptCoupleInvite(token: string): Promise<void> {
  if (USE_MOCK_DATA) return

  await request<void>('/api/couple/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function fetchCoupleInvites(): Promise<CoupleInvite[]> {
  if (USE_MOCK_DATA) return []

  const invites = await fetchAllPages<CoupleInvite>('/api/couple/invite', 'invites')
  return invites
}

export async function resendCoupleInvite(inviteId: string): Promise<void> {
  if (USE_MOCK_DATA) return

  await request<void>('/api/couple/invite', {
    method: 'PATCH',
    body: JSON.stringify({ inviteId, action: 'resend' }),
  })
}

export async function cancelCoupleInvite(inviteId: string): Promise<void> {
  if (USE_MOCK_DATA) return

  await request<void>('/api/couple/invite', {
    method: 'PATCH',
    body: JSON.stringify({ inviteId, action: 'cancel' }),
  })
}

export async function fetchCoupleActivity(): Promise<CoupleActivity[]> {
  if (USE_MOCK_DATA) return []

  const activity = await fetchAllPages<CoupleActivity>('/api/couple/activity', 'activity')
  return activity
}

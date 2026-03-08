import type { GiftItem, GiftFormData } from '../types/gift'

const BASE = '/api/gifts'
const USE_MOCK_DATA = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true'
const MOCK_STORAGE_KEY = 'love-presents:mock-gifts'

export type UserRole = 'anh' | 'em'

interface SessionPayload {
  ok: boolean
  role?: UserRole | null
  hasCouple?: boolean
  email?: string
}

interface InvitePayload {
  id: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

interface InviteListPayload {
  ok: boolean
  invites: InvitePayload[]
}

interface ActivityPayload {
  id: string
  type: 'couple_created' | 'invite_sent' | 'invite_accepted' | 'gift_added'
  at: string
  title: string
  description: string
}

interface ActivityListPayload {
  ok: boolean
  activity: ActivityPayload[]
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
  type: 'couple_created' | 'invite_sent' | 'invite_accepted' | 'gift_added'
  at: string
  title: string
  description: string
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

export async function fetchGifts(): Promise<GiftItem[]> {
  if (USE_MOCK_DATA) {
    const gifts = readMockGifts()
    return gifts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  return request<GiftItem[]>(BASE)
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

  const payload = await request<InviteListPayload>('/api/couple/invite')
  return payload.invites ?? []
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

  const payload = await request<ActivityListPayload>('/api/couple/activity')
  return payload.activity ?? []
}

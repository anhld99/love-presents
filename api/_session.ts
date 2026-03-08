import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parse, serialize } from 'cookie'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'lp_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

interface SessionData {
  userId: string
  email: string
}

function sign(value: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(value)
  return `${value}.${hmac.digest('hex')}`
}

function verify(signed: string, secret: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value, secret)
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signed)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return value
}

function parseSessionPayload(payload: string): SessionData | null {
  const parts = payload.split(':')

  if (parts[0] !== 'auth') return null
  if (parts.length !== 3) return null

  try {
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf8')
    const parsed = JSON.parse(decoded) as { userId?: unknown, email?: unknown }
    if (typeof parsed.userId !== 'string' || !parsed.userId) return null
    if (typeof parsed.email !== 'string' || !parsed.email) return null
    return { userId: parsed.userId, email: parsed.email }
  } catch {
    return null
  }
}

export function createSessionCookie(session: SessionData): string {
  const secret = process.env.SESSION_SECRET!
  const encoded = Buffer
    .from(JSON.stringify({ userId: session.userId, email: session.email }), 'utf8')
    .toString('base64url')
  const payload = `auth:${encoded}:${Date.now()}`
  const signed = sign(payload, secret)
  return serialize(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
}

export function clearSessionCookie(): string {
  return serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export function getSession(req: VercelRequest): SessionData | null {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null

  const cookies = parse(req.headers.cookie ?? '')
  const raw = cookies[SESSION_COOKIE]
  if (!raw) return null

  const payload = verify(raw, secret)
  if (!payload) return null

  return parseSessionPayload(payload)
}

export function isAuthenticated(req: VercelRequest): boolean {
  return getSession(req) !== null
}

export function getSessionUser(req: VercelRequest): SessionData | null {
  return getSession(req)
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Chưa đăng nhập' })
    return false
  }
  return true
}

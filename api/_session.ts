import type { VercelRequest, VercelResponse } from '@vercel/node'
import { parse, serialize } from 'cookie'
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_COOKIE = 'lp_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

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

export function createSessionCookie(): string {
  const secret = process.env.SESSION_SECRET!
  const payload = `auth:${Date.now()}`
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

export function isAuthenticated(req: VercelRequest): boolean {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  const cookies = parse(req.headers.cookie ?? '')
  const raw = cookies[SESSION_COOKIE]
  if (!raw) return false
  return verify(raw, secret) !== null
}

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Chưa đăng nhập' })
    return false
  }
  return true
}

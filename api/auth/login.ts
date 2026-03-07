import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSessionCookie } from '../_session.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body as { password?: string }
  const expected = process.env.APP_SHARED_PASSWORD

  if (!expected || !password) {
    return res.status(400).json({ error: 'Thiếu mật khẩu' })
  }

  if (password !== expected) {
    return res.status(401).json({ error: 'Mật khẩu không đúng' })
  }

  res.setHeader('Set-Cookie', createSessionCookie())
  return res.status(200).json({ ok: true })
}

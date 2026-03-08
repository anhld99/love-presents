import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, normalizeEmail } from '../_couples.js'
import { createSessionCookie } from '../_session.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface GoogleLoginBody {
  accessToken?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accessToken } = req.body as GoogleLoginBody
  const token = accessToken?.trim()

  if (!token) {
    return res.status(400).json({ error: 'Thiếu access token từ Google' })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ error: 'Phiên Google không hợp lệ, vui lòng đăng nhập lại' })
  }

  const email = normalizeEmail(data.user.email ?? '')
  if (!email) {
    return res.status(400).json({ error: 'Không lấy được email từ tài khoản Google' })
  }

  const user = {
    userId: data.user.id,
    email,
  }

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)

    res.setHeader('Set-Cookie', createSessionCookie(user))
    return res.status(200).json({
      ok: true,
      email,
      role: membership?.role ?? null,
      hasCouple: membership !== null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể hoàn tất đăng nhập Google'
    return res.status(500).json({ error: message })
  }
}

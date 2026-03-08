import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    return res.status(200).json({
      ok: true,
      email: user.email,
      role: membership?.role ?? null,
      hasCouple: membership !== null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể kiểm tra phiên đăng nhập'
    return res.status(500).json({ error: message })
  }
}

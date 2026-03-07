import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_session'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return
  return res.status(200).json({ ok: true })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { GiftFormData } from '../../src/types/gift.js'
import { toGiftItem, toInsertPayload } from '../_giftMapper.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi dùng danh sách quà' })
    }

    const role = membership.role

    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      if (role === 'em') {
        return res.status(403).json({ error: 'Tài khoản em không có quyền xem danh sách quà' })
      }

      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json((data ?? []).map(toGiftItem))
    }

    if (req.method === 'POST') {
      const body = req.body as GiftFormData
      if (!body.name || !body.category || !body.budgetRange || !body.desireLevel) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
      }

      const { data, error } = await supabase
        .from('gifts')
        .insert({
          ...toInsertPayload(body),
          couple_id: membership.coupleId,
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json(toGiftItem(data))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu quà tặng'
    return res.status(500).json({ error: message })
  }
}

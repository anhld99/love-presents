import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { GiftItem } from '../../src/types/gift.js'
import { toGiftItem, toUpdatePayload } from '../_giftMapper.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Thiếu id' })
  }

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)

    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi cập nhật quà' })
    }

    if (membership.role === 'em') {
      return res.status(403).json({ error: 'Tài khoản em không có quyền sửa hoặc xoá quà' })
    }

    const supabase = getSupabaseAdmin()

    if (req.method === 'PATCH') {
      const body = req.body as Partial<GiftItem>
      const patch = toUpdatePayload(body)
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' })
      }
      patch.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('gifts')
        .update(patch)
        .eq('id', id)
        .eq('couple_id', membership.coupleId)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json(toGiftItem(data))
    }

    if (req.method === 'DELETE') {
      const { data, error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', id)
        .eq('couple_id', membership.coupleId)
        .select('id')
        .maybeSingle()

      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Không tìm thấy quà để xoá' })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu quà tặng'
    return res.status(500).json({ error: message })
  }
}

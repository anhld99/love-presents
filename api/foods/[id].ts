import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface FoodOwnerRow {
  id: string
  created_by: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Thiếu id món ăn' })
  }

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)

    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi quản lý món ăn' })
    }

    if (req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const supabase = getSupabaseAdmin()
    const { data: existing, error: existingError } = await supabase
      .from('food_options')
      .select('id, created_by')
      .eq('id', id)
      .eq('couple_id', membership.coupleId)
      .maybeSingle<FoodOwnerRow>()

    if (existingError) return res.status(500).json({ error: existingError.message })
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy món ăn để xoá' })

    const canDelete = membership.role === 'anh' || existing.created_by === user.userId
    if (!canDelete) {
      return res.status(403).json({ error: 'Bạn chỉ có thể xoá món do chính mình thêm' })
    }

    const { data, error } = await supabase
      .from('food_options')
      .delete()
      .eq('id', existing.id)
      .eq('couple_id', membership.coupleId)
      .select('id')
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Không tìm thấy món ăn để xoá' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xoá món ăn'
    return res.status(500).json({ error: message })
  }
}

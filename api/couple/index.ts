import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface CreateCoupleBody {
  name?: string
}

interface CoupleRow {
  id: string
  name: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
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
      const message = err instanceof Error ? err.message : 'Không thể tải trạng thái couple'
      return res.status(500).json({ error: message })
    }
  }

  if (req.method === 'POST') {
    const body = req.body as CreateCoupleBody
    const requestedName = body.name?.trim() ?? ''
    const defaultName = `Couple của ${user.email.split('@')[0] ?? 'hai bạn'}`
    const coupleName = requestedName || defaultName

    try {
      await ensureAppUser(user)
      const existing = await getMembershipByUserId(user.userId)
      if (existing) {
        return res.status(409).json({ error: 'Bạn đã thuộc một couple khác' })
      }

      const supabase = getSupabaseAdmin()
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .insert({
          name: coupleName,
          created_by: user.userId,
        })
        .select('id, name')
        .single<CoupleRow>()

      if (coupleError) {
        return res.status(500).json({ error: coupleError.message })
      }

      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({
          couple_id: couple.id,
          user_id: user.userId,
          role: 'anh',
        })

      if (memberError) {
        await supabase.from('couples').delete().eq('id', couple.id)
        return res.status(500).json({ error: memberError.message })
      }

      return res.status(201).json({
        ok: true,
        hasCouple: true,
        role: 'anh',
        coupleName: couple.name,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo couple'
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_session.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { GiftFormData } from '../../src/types/gift.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return

  const supabase = getSupabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const body = req.body as GiftFormData
    if (!body.name || !body.category || !body.budgetRange || !body.desireLevel) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
    }

    const { data, error } = await supabase
      .from('gifts')
      .insert({
        name: body.name,
        category: body.category,
        budget_range: body.budgetRange,
        desire_level: body.desireLevel,
        sample_url: body.sampleUrl ?? '',
        is_gifted: false,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

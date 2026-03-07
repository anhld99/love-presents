import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth } from '../_session'
import { getSupabaseAdmin } from '../_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Thiếu id' })
  }

  const supabase = getSupabaseAdmin()

  if (req.method === 'PATCH') {
    const body = req.body as Record<string, unknown>

    // Map camelCase to snake_case for DB columns
    const patch: Record<string, unknown> = {}
    if ('name' in body) patch.name = body.name
    if ('category' in body) patch.category = body.category
    if ('budgetRange' in body) patch.budget_range = body.budgetRange
    if ('desireLevel' in body) patch.desire_level = body.desireLevel
    if ('sampleUrl' in body) patch.sample_url = body.sampleUrl
    if ('isGifted' in body) patch.is_gifted = body.isGifted
    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('gifts')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('gifts').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

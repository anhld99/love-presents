import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSessionUser } from './_session.js'
import { getSupabaseAdmin } from './_supabase.js'

export type CoupleRole = 'anh' | 'em'

export interface SessionUser {
  userId: string
  email: string
}

export interface CoupleMembership {
  coupleId: string
  role: CoupleRole
}

interface CoupleMemberRow {
  couple_id: string
  role: CoupleRole
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function requireSessionUser(req: VercelRequest, res: VercelResponse): SessionUser | null {
  const user = getSessionUser(req)
  if (!user) {
    res.status(401).json({ error: 'Chưa đăng nhập' })
    return null
  }

  return user
}

export async function ensureAppUser(user: SessionUser): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('app_users')
    .upsert({ id: user.userId, email: normalizeEmail(user.email) })

  if (error) throw new Error(error.message)
}

export async function getMembershipByUserId(userId: string): Promise<CoupleMembership | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', userId)
    .maybeSingle<CoupleMemberRow>()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    coupleId: data.couple_id,
    role: data.role,
  }
}

export async function getCoupleMemberCount(coupleId: string): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { count, error } = await supabase
    .from('couple_members')
    .select('id', { count: 'exact', head: true })
    .eq('couple_id', coupleId)

  if (error) throw new Error(error.message)
  return count ?? 0
}

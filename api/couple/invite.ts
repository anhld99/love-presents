import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { ensureAppUser, getMembershipByUserId, normalizeEmail, requireSessionUser } from '../_couples.js'
import { sendInviteEmail } from '../_mailer.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface InviteBody {
  email?: string
}

interface CoupleNameRow {
  name: string
}

interface CoupleRoleRow {
  role: 'anh' | 'em'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = requireSessionUser(req, res)
  if (!user) return

  const body = req.body as InviteBody
  const inviteeEmail = normalizeEmail(body.email ?? '')

  if (!inviteeEmail) {
    return res.status(400).json({ error: 'Vui lòng nhập email để mời' })
  }

  if (inviteeEmail === normalizeEmail(user.email)) {
    return res.status(400).json({ error: 'Không thể mời chính email của bạn' })
  }

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)

    if (!membership) {
      return res.status(400).json({ error: 'Bạn chưa thuộc couple nào để gửi lời mời' })
    }

    if (membership.role !== 'anh') {
      return res.status(403).json({ error: 'Chỉ anh mới được gửi lời mời cho em' })
    }

    const supabase = getSupabaseAdmin()
    const { data: roles, error: rolesError } = await supabase
      .from('couple_members')
      .select('role')
      .eq('couple_id', membership.coupleId)

    if (rolesError) {
      return res.status(500).json({ error: rolesError.message })
    }

    const members = (roles ?? []) as CoupleRoleRow[]
    const hasEm = members.some(member => member.role === 'em')
    if (hasEm || members.length >= 2) {
      return res.status(409).json({ error: 'Couple đã đủ 2 thành viên' })
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', inviteeEmail)
      .maybeSingle<{ id: string }>()

    if (existingUserError) {
      return res.status(500).json({ error: existingUserError.message })
    }

    if (existingUser?.id) {
      const existingMembership = await getMembershipByUserId(existingUser.id)
      if (existingMembership) {
        return res.status(409).json({ error: 'Email này đã thuộc một couple khác' })
      }
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('name')
      .eq('id', membership.coupleId)
      .single<CoupleNameRow>()

    if (coupleError) {
      return res.status(500).json({ error: coupleError.message })
    }

    await supabase
      .from('couple_invites')
      .update({ status: 'cancelled' })
      .eq('couple_id', membership.coupleId)
      .eq('invitee_email', inviteeEmail)
      .eq('status', 'pending')

    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

    const { error: inviteError } = await supabase
      .from('couple_invites')
      .insert({
        couple_id: membership.coupleId,
        inviter_user_id: user.userId,
        invitee_email: inviteeEmail,
        token,
        expires_at: expiresAt,
      })

    if (inviteError) {
      return res.status(500).json({ error: inviteError.message })
    }

    const appUrl = getAppUrl(req)
    const inviteUrl = `${appUrl}/invite/accept?token=${token}`

    await sendInviteEmail({
      inviteeEmail,
      inviterEmail: user.email,
      inviteUrl,
      coupleName: coupleData.name,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể gửi email mời'
    return res.status(500).json({ error: message })
  }
}

function getAppUrl(req: VercelRequest): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '')
  }

  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader

  if (!host) {
    throw new Error('Không xác định được APP_BASE_URL để tạo link mời')
  }

  const protoHeader = req.headers['x-forwarded-proto']
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader
  const scheme = protocol ?? 'https'
  return `${scheme}://${host}`
}

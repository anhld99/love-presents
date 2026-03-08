import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'
import { getAppBaseUrl } from '../_appUrl.js'
import { ensureAppUser, getMembershipByUserId, normalizeEmail, requireSessionUser } from '../_couples.js'
import { sendInviteEmail } from '../_mailer.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface InviteBody {
  email?: string
}

interface InviteActionBody {
  inviteId?: string
  action?: 'cancel' | 'resend'
}

interface CoupleNameRow {
  name: string
}

interface CoupleRoleRow {
  role: 'anh' | 'em'
}

interface AppUserRow {
  id: string
}

interface InviteListRow {
  id: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  created_at: string
  expires_at: string
  accepted_at: string | null
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)

    if (!membership) {
      return res.status(400).json({ error: 'Bạn chưa thuộc couple nào để quản lý lời mời' })
    }

    if (membership.role !== 'anh') {
      return res.status(403).json({ error: 'Chỉ anh mới được quản lý lời mời' })
    }

    if (req.method === 'GET') {
      return await listInvites(req, res, membership.coupleId)
    }

    if (req.method === 'POST') {
      const body = req.body as InviteBody
      const inviteeEmail = normalizeEmail(body.email ?? '')

      if (!inviteeEmail) {
        return res.status(400).json({ error: 'Vui lòng nhập email để mời' })
      }

      if (inviteeEmail === normalizeEmail(user.email)) {
        return res.status(400).json({ error: 'Không thể mời chính email của bạn' })
      }

      await createAndSendInvite({
        req,
        coupleId: membership.coupleId,
        inviterUserId: user.userId,
        inviterEmail: user.email,
        inviteeEmail,
      })

      return res.status(200).json({ ok: true })
    }

    if (req.method === 'PATCH') {
      const body = req.body as InviteActionBody
      const inviteId = body.inviteId?.trim()
      const action = body.action

      if (!inviteId || (action !== 'cancel' && action !== 'resend')) {
        return res.status(400).json({ error: 'Thiếu inviteId hoặc action không hợp lệ' })
      }

      const supabase = getSupabaseAdmin()
      const { data: invite, error: inviteError } = await supabase
        .from('couple_invites')
        .select('id, invitee_email, status')
        .eq('id', inviteId)
        .eq('couple_id', membership.coupleId)
        .maybeSingle<{ id: string, invitee_email: string, status: 'pending' | 'accepted' | 'cancelled' | 'expired' }>()

      if (inviteError) {
        return res.status(500).json({ error: inviteError.message })
      }

      if (!invite) {
        return res.status(404).json({ error: 'Không tìm thấy lời mời' })
      }

      if (action === 'cancel') {
        if (invite.status !== 'pending') {
          return res.status(409).json({ error: 'Chỉ có thể huỷ lời mời đang chờ xác nhận' })
        }

        const { error } = await supabase
          .from('couple_invites')
          .update({ status: 'cancelled' })
          .eq('id', invite.id)

        if (error) {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ ok: true })
      }

      if (invite.status === 'accepted') {
        return res.status(409).json({ error: 'Lời mời đã được xác nhận, không thể gửi lại' })
      }

      await createAndSendInvite({
        req,
        coupleId: membership.coupleId,
        inviterUserId: user.userId,
        inviterEmail: user.email,
        inviteeEmail: normalizeEmail(invite.invitee_email),
      })

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({ error: err.message })
    }

    const message = err instanceof Error ? err.message : 'Không thể quản lý lời mời'
    return res.status(500).json({ error: message })
  }
}

async function listInvites(req: VercelRequest, res: VercelResponse, coupleId: string) {
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  await supabase
    .from('couple_invites')
    .update({ status: 'expired' })
    .eq('couple_id', coupleId)
    .eq('status', 'pending')
    .lte('expires_at', now)

  const { data, error } = await supabase
    .from('couple_invites')
    .select('id, invitee_email, status, created_at, expires_at, accepted_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const invites = ((data ?? []) as InviteListRow[]).map(invite => ({
    id: invite.id,
    inviteeEmail: invite.invitee_email,
    status: invite.status,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
  }))

  return res.status(200).json({
    ok: true,
    appBaseUrl: getAppBaseUrl(req),
    invites,
  })
}

async function createAndSendInvite({
  req,
  coupleId,
  inviterUserId,
  inviterEmail,
  inviteeEmail,
}: {
  req: VercelRequest
  coupleId: string
  inviterUserId: string
  inviterEmail: string
  inviteeEmail: string
}) {
  const supabase = getSupabaseAdmin()

  const { data: roles, error: rolesError } = await supabase
    .from('couple_members')
    .select('role')
    .eq('couple_id', coupleId)

  if (rolesError) {
    throw new Error(rolesError.message)
  }

  const members = (roles ?? []) as CoupleRoleRow[]
  const hasEm = members.some(member => member.role === 'em')
  if (hasEm || members.length >= 2) {
    throw new ApiError(409, 'Couple đã đủ 2 thành viên')
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', inviteeEmail)
    .maybeSingle<AppUserRow>()

  if (existingUserError) {
    throw new Error(existingUserError.message)
  }

  if (existingUser?.id) {
    const existingMembership = await getMembershipByUserId(existingUser.id)
    if (existingMembership) {
      throw new ApiError(409, 'Email này đã thuộc một couple khác')
    }
  }

  const { data: coupleData, error: coupleError } = await supabase
    .from('couples')
    .select('name')
    .eq('id', coupleId)
    .single<CoupleNameRow>()

  if (coupleError) {
    throw new Error(coupleError.message)
  }

  await supabase
    .from('couple_invites')
    .update({ status: 'cancelled' })
    .eq('couple_id', coupleId)
    .eq('invitee_email', inviteeEmail)
    .eq('status', 'pending')

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const { error: inviteError } = await supabase
    .from('couple_invites')
    .insert({
      couple_id: coupleId,
      inviter_user_id: inviterUserId,
      invitee_email: inviteeEmail,
      token,
      expires_at: expiresAt,
    })

  if (inviteError) {
    throw new Error(inviteError.message)
  }

  const inviteUrl = `${getAppBaseUrl(req)}/invite/accept?token=${token}`
  await sendInviteEmail({
    inviteeEmail,
    inviterEmail,
    inviteUrl,
    coupleName: coupleData.name,
  })
}

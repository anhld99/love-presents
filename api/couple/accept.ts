import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAppBaseUrl } from '../_appUrl.js'
import { ensureAppUser, getCoupleMemberEmailByRole, getMembershipByUserId, normalizeEmail, requireSessionUser } from '../_couples.js'
import { sendInviteAcceptedEmail } from '../_mailer.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface AcceptInviteBody {
  token?: string
}

interface InviteRow {
  id: string
  couple_id: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'cancelled' | 'expired'
  expires_at: string
}

interface RoleRow {
  role: 'anh' | 'em'
}

interface CoupleNameRow {
  name: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = requireSessionUser(req, res)
  if (!user) return

  const body = req.body as AcceptInviteBody
  const token = body.token?.trim()

  if (!token) {
    return res.status(400).json({ error: 'Thiếu token lời mời' })
  }

  try {
    await ensureAppUser(user)

    const currentMembership = await getMembershipByUserId(user.userId)
    if (currentMembership) {
      return res.status(409).json({ error: 'Bạn đã thuộc một couple, không thể nhận thêm lời mời' })
    }

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data: invite, error: inviteError } = await supabase
      .from('couple_invites')
      .select('id, couple_id, invitee_email, status, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', now)
      .maybeSingle<InviteRow>()

    if (inviteError) {
      return res.status(500).json({ error: inviteError.message })
    }

    if (!invite) {
      return res.status(404).json({ error: 'Lời mời không tồn tại hoặc đã hết hạn' })
    }

    const inviteEmail = normalizeEmail(invite.invitee_email)
    const userEmail = normalizeEmail(user.email)
    if (inviteEmail !== userEmail) {
      return res.status(403).json({ error: 'Email đăng nhập không khớp với email được mời' })
    }

    const { data: roles, error: rolesError } = await supabase
      .from('couple_members')
      .select('role')
      .eq('couple_id', invite.couple_id)

    if (rolesError) {
      return res.status(500).json({ error: rolesError.message })
    }

    const members = (roles ?? []) as RoleRow[]
    if (members.some(member => member.role === 'em') || members.length >= 2) {
      return res.status(409).json({ error: 'Couple đã đủ thành viên, không thể nhận lời mời này' })
    }

    const { error: insertError } = await supabase
      .from('couple_members')
      .insert({
        couple_id: invite.couple_id,
        user_id: user.userId,
        role: 'em',
      })

    if (insertError) {
      return res.status(500).json({ error: insertError.message })
    }

    const acceptedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('couple_invites')
      .update({ status: 'accepted', accepted_at: acceptedAt })
      .eq('id', invite.id)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    await supabase
      .from('couple_invites')
      .update({ status: 'cancelled' })
      .eq('invitee_email', inviteEmail)
      .eq('status', 'pending')
      .neq('id', invite.id)

    const anhEmail = await getCoupleMemberEmailByRole(invite.couple_id, 'anh')
    if (anhEmail) {
      try {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('name')
          .eq('id', invite.couple_id)
          .maybeSingle<CoupleNameRow>()

        if (coupleError) {
          throw new Error(coupleError.message)
        }

        await sendInviteAcceptedEmail({
          anhEmail,
          emEmail: user.email,
          coupleName: coupleData?.name ?? 'Love Presents',
          giftListUrl: `${getAppBaseUrl(req)}/gifts`,
        })
      } catch (notifyError) {
        console.error('Failed to notify anh when invite accepted', notifyError)
      }
    }

    return res.status(200).json({ ok: true, hasCouple: true, role: 'em' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xác nhận lời mời'
    return res.status(500).json({ error: message })
  }
}

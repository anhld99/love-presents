import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { parsePagination, toPaginationMeta } from '../_pagination.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface CoupleRow {
  id: string
  name: string
  created_at: string
}

interface InviteRow {
  id: string
  invitee_email: string
  created_at: string
  accepted_at: string | null
}

interface GiftRow {
  id: string
  name: string
  created_at: string
  created_by: string | null
}

interface MemberRow {
  user_id: string
  role: 'anh' | 'em'
}

interface UserEmailRow {
  id: string
  email: string
}

interface CoupleActivityItem {
  id: string
  type: 'couple_created' | 'invite_sent' | 'invite_accepted' | 'gift_added'
  at: string
  title: string
  description: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    const { page, pageSize } = parsePagination(req)

    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi xem hoạt động' })
    }

    const supabase = getSupabaseAdmin()

    const [{ data: couple, error: coupleError }, { data: invites, error: invitesError }, { data: gifts, error: giftsError }, { data: members, error: membersError }] = await Promise.all([
      supabase
        .from('couples')
        .select('id, name, created_at')
        .eq('id', membership.coupleId)
        .single<CoupleRow>(),
      supabase
        .from('couple_invites')
        .select('id, invitee_email, created_at, accepted_at')
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false }),
      supabase
        .from('gifts')
        .select('id, name, created_at, created_by')
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false }),
      supabase
        .from('couple_members')
        .select('user_id, role')
        .eq('couple_id', membership.coupleId),
    ])

    if (coupleError) return res.status(500).json({ error: coupleError.message })
    if (invitesError) return res.status(500).json({ error: invitesError.message })
    if (giftsError) return res.status(500).json({ error: giftsError.message })
    if (membersError) return res.status(500).json({ error: membersError.message })

    const typedMembers = (members ?? []) as MemberRow[]
    const userIds = typedMembers.map(member => member.user_id)

    const { data: users, error: usersError } = userIds.length
      ? await supabase
        .from('app_users')
        .select('id, email')
        .in('id', userIds)
      : { data: [], error: null }

    if (usersError) return res.status(500).json({ error: usersError.message })

    const roleByUserId = new Map(typedMembers.map(member => [member.user_id, member.role]))
    const emailByUserId = new Map(((users ?? []) as UserEmailRow[]).map(member => [member.id, member.email]))

    const activity: CoupleActivityItem[] = []

    activity.push({
      id: `couple-${couple.id}`,
      type: 'couple_created',
      at: couple.created_at,
      title: `Tạo couple ${couple.name}`,
      description: 'Couple được tạo và sẵn sàng mời em tham gia.',
    })

    for (const invite of (invites ?? []) as InviteRow[]) {
      activity.push({
        id: `invite-sent-${invite.id}`,
        type: 'invite_sent',
        at: invite.created_at,
        title: `Đã gửi lời mời cho ${invite.invitee_email}`,
        description: 'Lời mời vào couple đã được gửi qua email.',
      })

      if (invite.accepted_at) {
        activity.push({
          id: `invite-accepted-${invite.id}`,
          type: 'invite_accepted',
          at: invite.accepted_at,
          title: `${invite.invitee_email} đã xác nhận lời mời`,
          description: 'Em đã tham gia couple thành công.',
        })
      }
    }

    for (const gift of (gifts ?? []) as GiftRow[]) {
      const role = gift.created_by ? roleByUserId.get(gift.created_by) : null
      const email = gift.created_by ? emailByUserId.get(gift.created_by) : null

      let actorText = 'Một thành viên'
      if (role === 'em') actorText = 'Em'
      if (role === 'anh') actorText = 'Anh'

      activity.push({
        id: `gift-${gift.id}`,
        type: 'gift_added',
        at: gift.created_at,
        title: `${actorText} đã thêm quà: ${gift.name}`,
        description: email ? `Tài khoản thực hiện: ${email}` : 'Món quà mới đã được thêm vào danh sách.',
      })
    }

    activity.sort((a, b) => b.at.localeCompare(a.at))

    const from = (page - 1) * pageSize
    const items = activity.slice(from, from + pageSize)

    return res.status(200).json({
      ok: true,
      items,
      activity: items,
      pagination: toPaginationMeta(activity.length, page, pageSize),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải hoạt động couple'
    return res.status(500).json({ error: message })
  }
}

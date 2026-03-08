import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAppBaseUrl } from '../_appUrl.js'
import { ensureAppUser, getCoupleMemberEmailByRole, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { sendGiftAddedEmail } from '../_mailer.js'
import { parsePagination, toPaginationMeta } from '../_pagination.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { GiftFormData } from '../../src/types/gift.js'
import { toGiftItem, toInsertPayload } from '../_giftMapper.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi dùng danh sách quà' })
    }

    const role = membership.role

    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      if (role === 'em') {
        return res.status(403).json({ error: 'Tài khoản em không có quyền xem danh sách quà' })
      }

      const { page, pageSize, from, to } = parsePagination(req)

      const { data, count, error } = await supabase
        .from('gifts')
        .select('*', { count: 'exact' })
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({
        items: (data ?? []).map(toGiftItem),
        pagination: toPaginationMeta(count ?? 0, page, pageSize),
      })
    }

    if (req.method === 'POST') {
      const body = req.body as GiftFormData
      if (!body.name || !body.category || !body.budgetRange || !body.desireLevel) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
      }

      const { data, error } = await supabase
        .from('gifts')
        .insert({
          ...toInsertPayload(body),
          couple_id: membership.coupleId,
          created_by: user.userId,
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })

      const createdGift = toGiftItem(data)

      if (role === 'em') {
        const anhEmail = await getCoupleMemberEmailByRole(membership.coupleId, 'anh')
        if (anhEmail) {
          try {
            await sendGiftAddedEmail({
              anhEmail,
              emEmail: user.email,
              giftName: createdGift.name,
              category: createdGift.category,
              budgetRange: createdGift.budgetRange,
              desireLevel: createdGift.desireLevel,
              sampleUrl: createdGift.sampleUrl,
              giftListUrl: `${getAppBaseUrl(req)}/gifts`,
            })
          } catch (notifyError) {
            console.error('Failed to notify anh when em added gift', notifyError)
          }
        }
      }

      return res.status(201).json(createdGift)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu quà tặng'
    return res.status(500).json({ error: message })
  }
}

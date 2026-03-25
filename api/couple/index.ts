import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAppBaseUrl } from '../_appUrl.js'
import { ensureAppUser, getCoupleMemberEmailByRole, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { sendComfortAlertEmail, sendComfortReplyEmail } from '../_mailer.js'
import { getSupabaseAdmin } from '../_supabase.js'

interface CreateCoupleBody {
  name?: string
}

interface CoupleActionBody {
  action?: 'comfort-alert' | 'comfort-reply'
}

interface CoupleRow {
  id: string
  name: string
}

interface ComfortAlertRow {
  id: string
  created_at: string
}

const COMFORT_ALERT_COOLDOWN_MS = 1000 * 60 * 30

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    try {
      await ensureAppUser(user)
      const membership = await getMembershipByUserId(user.userId)
      const latestComfortAlertAt = membership
        ? await getLatestComfortAlertAt(membership.coupleId)
        : null
      const comfortAlertCooldownUntil = membership && membership.role === 'em'
        ? toCooldownUntil(latestComfortAlertAt)
        : null

      return res.status(200).json({
        ok: true,
        email: user.email,
        role: membership?.role ?? null,
        hasCouple: membership !== null,
        comfortAlertCooldownUntil,
        latestComfortAlertAt,
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

  if (req.method === 'PATCH') {
    const body = req.body as CoupleActionBody

    try {
      await ensureAppUser(user)
      const membership = await getMembershipByUserId(user.userId)
      if (!membership) {
        return res.status(400).json({ error: 'Bạn chưa thuộc couple nào để gửi tín hiệu cầu cứu' })
      }

      if (body.action !== 'comfort-alert' && body.action !== 'comfort-reply') {
        return res.status(400).json({ error: 'Action không hợp lệ' })
      }

      const supabase = getSupabaseAdmin()
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id, name')
        .eq('id', membership.coupleId)
        .single<CoupleRow>()

      if (coupleError) {
        return res.status(500).json({ error: coupleError.message })
      }

      if (body.action === 'comfort-reply') {
        if (membership.role !== 'anh') {
          return res.status(403).json({ error: 'Chỉ anh mới có thể gửi lời dỗ em' })
        }

        const latestComfortAlertAt = await getLatestComfortAlertAt(membership.coupleId)
        if (!latestComfortAlertAt) {
          return res.status(409).json({ error: 'Chưa có tín hiệu nào từ em để phản hồi' })
        }

        const emEmail = await getCoupleMemberEmailByRole(membership.coupleId, 'em')
        if (!emEmail) {
          return res.status(404).json({ error: 'Chưa tìm thấy email của em để gửi lời nhắn' })
        }

        await sendComfortReplyEmail({
          anhEmail: user.email,
          emEmail,
          coupleName: couple.name,
          appUrl: `${getAppBaseUrl(req)}/couple`,
        })

        const { error: comfortReplyError } = await supabase
          .from('comfort_replies')
          .insert({
            couple_id: membership.coupleId,
            sent_by: user.userId,
          })

        if (comfortReplyError) {
          return res.status(500).json({ error: comfortReplyError.message })
        }

        return res.status(200).json({ ok: true })
      }

      if (membership.role !== 'em') {
        return res.status(403).json({ error: 'Chỉ em mới có thể gửi tín hiệu này cho anh' })
      }

      const comfortAlertCooldownUntil = toCooldownUntil(await getLatestComfortAlertAt(membership.coupleId))
      if (comfortAlertCooldownUntil) {
        return res.status(409).json({
          error: `Anh vừa được nhắc rồi. Có thể gửi lại sau ${formatRemainingDuration(comfortAlertCooldownUntil)} nữa nha.`,
          comfortAlertCooldownUntil,
        })
      }

      const anhEmail = await getCoupleMemberEmailByRole(membership.coupleId, 'anh')
      if (!anhEmail) {
        return res.status(404).json({ error: 'Chưa tìm thấy email của anh để gửi thông báo' })
      }

      await sendComfortAlertEmail({
        anhEmail,
        emEmail: user.email,
        coupleName: couple.name,
        appUrl: `${getAppBaseUrl(req)}/couple`,
      })

      const createdAt = new Date().toISOString()
      const { error: comfortAlertError } = await supabase
        .from('comfort_alerts')
        .insert({
          couple_id: membership.coupleId,
          sent_by: user.userId,
          created_at: createdAt,
        })

      if (comfortAlertError) {
        return res.status(500).json({ error: comfortAlertError.message })
      }

      return res.status(200).json({
        ok: true,
        comfortAlertCooldownUntil: new Date(new Date(createdAt).getTime() + COMFORT_ALERT_COOLDOWN_MS).toISOString(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi tín hiệu cầu cứu cho anh'
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function getLatestComfortAlertAt(coupleId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('comfort_alerts')
    .select('id, created_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ComfortAlertRow>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return data.created_at
}

function toCooldownUntil(createdAt: string | null): string | null {
  if (!createdAt) {
    return null
  }

  const cooldownUntil = new Date(new Date(createdAt).getTime() + COMFORT_ALERT_COOLDOWN_MS)
  return cooldownUntil.getTime() > Date.now() ? cooldownUntil.toISOString() : null
}

function formatRemainingDuration(cooldownUntil: string): string {
  const remainingMs = Math.max(0, new Date(cooldownUntil).getTime() - Date.now())
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds} giây`
  }

  if (seconds === 0) {
    return `${minutes} phút`
  }

  return `${minutes} phút ${seconds} giây`
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { parsePagination, toPaginationMeta } from '../_pagination.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { FoodSpinPayload } from '../../src/types/food.js'

interface FoodOptionRow {
  id: string
  name: string
  restaurant_address: string
  price_level: 'binh_dan' | 'dat_do'
}

interface FoodSpinHistoryRow {
  id: string
  food_option_id: string | null
  food_name: string
  restaurant_address: string
  price_level: 'binh_dan' | 'dat_do'
  created_at: string
  spun_by: string | null
}

interface AppUserRow {
  id: string
  email: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi dùng lịch sử quay món' })
    }

    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const { page, pageSize, from, to } = parsePagination(req)
      const levelQuery = parseLevel(req.query.priceLevel)

      let query = supabase
        .from('food_spin_history')
        .select('id, food_option_id, food_name, restaurant_address, price_level, created_at, spun_by', { count: 'exact' })
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (levelQuery) {
        query = query.eq('price_level', levelQuery)
      }

      const { data, count, error } = await query
      if (error) return res.status(500).json({ error: error.message })

      const rows = (data ?? []) as FoodSpinHistoryRow[]
      const userIds = rows.flatMap(row => row.spun_by ? [row.spun_by] : [])

      const { data: users, error: usersError } = userIds.length
        ? await supabase
          .from('app_users')
          .select('id, email')
          .in('id', userIds)
        : { data: [], error: null }

      if (usersError) return res.status(500).json({ error: usersError.message })

      const emailByUserId = new Map(((users ?? []) as AppUserRow[]).map(item => [item.id, item.email]))

      return res.status(200).json({
        items: rows.map(row => toFoodSpinHistoryItem(row, emailByUserId)),
        pagination: toPaginationMeta(count ?? 0, page, pageSize),
      })
    }

    if (req.method === 'POST') {
      const body = req.body as FoodSpinPayload
      const optionId = body.optionId?.trim()
      if (!optionId) {
        return res.status(400).json({ error: 'Thiếu món ăn để lưu lịch sử quay' })
      }

      const { data: option, error: optionError } = await supabase
        .from('food_options')
        .select('id, name, restaurant_address, price_level')
        .eq('id', optionId)
        .eq('couple_id', membership.coupleId)
        .maybeSingle<FoodOptionRow>()

      if (optionError) return res.status(500).json({ error: optionError.message })
      if (!option) return res.status(404).json({ error: 'Không tìm thấy món ăn để lưu lịch sử quay' })

      const { data, error } = await supabase
        .from('food_spin_history')
        .insert({
          couple_id: membership.coupleId,
          food_option_id: option.id,
          spun_by: user.userId,
          food_name: option.name,
          restaurant_address: option.restaurant_address,
          price_level: option.price_level,
        })
        .select('id, food_option_id, food_name, restaurant_address, price_level, created_at, spun_by')
        .single<FoodSpinHistoryRow>()

      if (error) return res.status(500).json({ error: error.message })

      return res.status(201).json(toFoodSpinHistoryItem(data, new Map([[user.userId, user.email]])))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xử lý lịch sử quay món'
    return res.status(500).json({ error: message })
  }
}

function toFoodSpinHistoryItem(row: FoodSpinHistoryRow, emailByUserId: Map<string, string>) {
  return {
    id: row.id,
    foodOptionId: row.food_option_id,
    foodName: row.food_name,
    restaurantAddress: row.restaurant_address,
    priceLevel: row.price_level,
    spunAt: row.created_at,
    spunByEmail: row.spun_by ? emailByUserId.get(row.spun_by) ?? null : null,
  }
}

function parseLevel(value: string | string[] | undefined): 'binh_dan' | 'dat_do' | null {
  const first = Array.isArray(value) ? value[0] : value
  if (first === 'binh_dan' || first === 'dat_do') {
    return first
  }
  return null
}

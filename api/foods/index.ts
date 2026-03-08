import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureAppUser, getMembershipByUserId, requireSessionUser } from '../_couples.js'
import { parsePagination, toPaginationMeta } from '../_pagination.js'
import { getSupabaseAdmin } from '../_supabase.js'
import type { FoodOptionFormData } from '../../src/types/food.js'

interface FoodRow {
  id: string
  name: string
  restaurant_address: string
  price_level: 'binh_dan' | 'dat_do'
  created_at: string
  updated_at: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = requireSessionUser(req, res)
  if (!user) return

  try {
    await ensureAppUser(user)
    const membership = await getMembershipByUserId(user.userId)
    if (!membership) {
      return res.status(403).json({ error: 'Bạn cần tham gia một couple trước khi dùng tính năng ăn uống' })
    }

    const supabase = getSupabaseAdmin()

    if (req.method === 'GET') {
      const { page, pageSize, from, to } = parsePagination(req)
      const levelQuery = parseLevel(req.query.priceLevel)

      let query = supabase
        .from('food_options')
        .select('id, name, restaurant_address, price_level, created_at, updated_at', { count: 'exact' })
        .eq('couple_id', membership.coupleId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (levelQuery) {
        query = query.eq('price_level', levelQuery)
      }

      const { data, count, error } = await query

      if (error) return res.status(500).json({ error: error.message })
      const payload = ((data ?? []) as FoodRow[]).map(toFoodOption)
      return res.status(200).json({
        items: payload,
        pagination: toPaginationMeta(count ?? 0, page, pageSize),
      })
    }

    if (req.method === 'POST') {
      if (membership.role !== 'anh') {
        return res.status(403).json({ error: 'Chỉ anh mới có quyền thêm món ăn' })
      }

      const body = req.body as FoodOptionFormData
      const name = body.name?.trim() ?? ''
      const restaurantAddress = body.restaurantAddress?.trim() ?? ''
      const priceLevel = body.priceLevel

      if (!name || !restaurantAddress || (priceLevel !== 'binh_dan' && priceLevel !== 'dat_do')) {
        return res.status(400).json({ error: 'Thiếu thông tin món ăn hoặc mức giá không hợp lệ' })
      }

      const { data, error } = await supabase
        .from('food_options')
        .insert({
          couple_id: membership.coupleId,
          created_by: user.userId,
          name,
          restaurant_address: restaurantAddress,
          price_level: priceLevel,
        })
        .select('id, name, restaurant_address, price_level, created_at, updated_at')
        .single<FoodRow>()

      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json(toFoodOption(data))
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xử lý món ăn hôm nay'
    return res.status(500).json({ error: message })
  }
}

function toFoodOption(row: FoodRow) {
  return {
    id: row.id,
    name: row.name,
    restaurantAddress: row.restaurant_address,
    priceLevel: row.price_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseLevel(value: string | string[] | undefined): 'binh_dan' | 'dat_do' | null {
  const first = Array.isArray(value) ? value[0] : value
  if (first === 'binh_dan' || first === 'dat_do') {
    return first
  }
  return null
}

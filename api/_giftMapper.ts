import type { GiftFormData, GiftItem } from '../src/types/gift.js'

interface GiftRow {
  id: string
  name: string
  category: GiftItem['category']
  budget_range: GiftItem['budgetRange']
  desire_level: GiftItem['desireLevel']
  sample_url: string | null
  is_gifted: boolean
  created_at: string
  updated_at: string
}

export function toGiftItem(row: GiftRow): GiftItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    budgetRange: row.budget_range,
    desireLevel: row.desire_level,
    sampleUrl: row.sample_url ?? '',
    isGifted: row.is_gifted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toInsertPayload(body: GiftFormData): Record<string, unknown> {
  return {
    name: body.name,
    category: body.category,
    budget_range: body.budgetRange,
    desire_level: body.desireLevel,
    sample_url: body.sampleUrl ?? '',
    is_gifted: false,
  }
}

export function toUpdatePayload(body: Partial<GiftItem>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if ('name' in body) patch.name = body.name
  if ('category' in body) patch.category = body.category
  if ('budgetRange' in body) patch.budget_range = body.budgetRange
  if ('desireLevel' in body) patch.desire_level = body.desireLevel
  if ('sampleUrl' in body) patch.sample_url = body.sampleUrl
  if ('isGifted' in body) patch.is_gifted = body.isGifted
  return patch
}

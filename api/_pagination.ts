import type { VercelRequest } from '@vercel/node'

interface PaginationOptions {
  defaultPageSize?: number
  maxPageSize?: number
}

export interface PaginationParams {
  page: number
  pageSize: number
  from: number
  to: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
}

export function parsePagination(req: VercelRequest, options?: PaginationOptions): PaginationParams {
  const defaultPageSize = options?.defaultPageSize ?? 20
  const maxPageSize = options?.maxPageSize ?? 100

  const pageRaw = first(req.query.page)
  const pageSizeRaw = first(req.query.pageSize)

  const page = normalizePositiveInt(pageRaw, 1)
  const requestedPageSize = normalizePositiveInt(pageSizeRaw, defaultPageSize)
  const pageSize = Math.min(requestedPageSize, maxPageSize)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { page, pageSize, from, to }
}

export function toPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const safeTotal = Math.max(0, total)
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / pageSize)
  return {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
    hasNext: totalPages > 0 && page < totalPages,
  }
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

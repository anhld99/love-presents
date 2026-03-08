import type { VercelRequest } from '@vercel/node'

export function getAppBaseUrl(req: VercelRequest, fallback = 'http://localhost:3000'): string {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '')
  }

  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader

  if (!host) {
    return fallback
  }

  const protoHeader = req.headers['x-forwarded-proto']
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader
  const scheme = protocol ?? 'https'
  return `${scheme}://${host}`
}

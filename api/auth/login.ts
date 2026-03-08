import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(410).json({ error: 'Đăng nhập mật khẩu đã tắt. Vui lòng dùng Google.' })
}

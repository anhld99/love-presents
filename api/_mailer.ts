import { normalizeEmail } from './_couples.js'

interface InviteEmailPayload {
  inviteeEmail: string
  inviterEmail: string
  inviteUrl: string
  coupleName: string
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.INVITE_EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('Thiếu RESEND_API_KEY hoặc INVITE_EMAIL_FROM để gửi email mời')
  }

  const inviteeEmail = normalizeEmail(payload.inviteeEmail)
  const inviterEmail = normalizeEmail(payload.inviterEmail)

  const subject = `Lời mời vào couple ${payload.coupleName}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Bạn nhận được lời mời vào Love Presents</h2>
      <p><strong>${escapeHtml(inviterEmail)}</strong> vừa mời bạn vào couple <strong>${escapeHtml(payload.coupleName)}</strong> với vai trò <strong>em</strong>.</p>
      <p>Nhấn nút bên dưới để xác nhận lời mời:</p>
      <p>
        <a href="${escapeHtml(payload.inviteUrl)}" style="display:inline-block;padding:10px 16px;background:#d74f72;color:#fff;text-decoration:none;border-radius:8px">
          Xác nhận lời mời
        </a>
      </p>
      <p>Sau khi xác nhận, bạn có thể đăng nhập bằng Google và thêm quà ngay.</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [inviteeEmail],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gửi email thất bại (${response.status}): ${body}`)
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

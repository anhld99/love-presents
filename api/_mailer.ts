import { normalizeEmail } from './_couples.js'
import nodemailer from 'nodemailer'

interface InviteEmailPayload {
  inviteeEmail: string
  inviterEmail: string
  inviteUrl: string
  coupleName: string
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<void> {
  const smtpUser = process.env.GMAIL_SMTP_USER
  const smtpAppPassword = process.env.GMAIL_SMTP_APP_PASSWORD
  const from = process.env.INVITE_EMAIL_FROM

  if (!smtpUser || !smtpAppPassword || !from) {
    throw new Error('Thiếu GMAIL_SMTP_USER, GMAIL_SMTP_APP_PASSWORD hoặc INVITE_EMAIL_FROM để gửi email mời')
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

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  })

  try {
    await transporter.sendMail({
      from,
      to: inviteeEmail,
      subject,
      html,
      replyTo: inviterEmail,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Gửi email thất bại: ${message}`)
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

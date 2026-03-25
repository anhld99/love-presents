import { normalizeEmail } from './_couples.js'
import nodemailer from 'nodemailer'

interface InviteEmailPayload {
  inviteeEmail: string
  inviterEmail: string
  inviteUrl: string
  coupleName: string
}

interface GiftAddedEmailPayload {
  anhEmail: string
  emEmail: string
  giftName: string
  category: string
  budgetRange: string
  desireLevel: string
  sampleUrl: string
  giftListUrl: string
}

interface InviteAcceptedEmailPayload {
  anhEmail: string
  emEmail: string
  coupleName: string
  giftListUrl: string
}

interface ComfortAlertEmailPayload {
  anhEmail: string
  emEmail: string
  coupleName: string
  appUrl: string
}

export async function sendInviteEmail(payload: InviteEmailPayload): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.INVITE_EMAIL_FROM

  if (!from) {
    throw new Error('Thiếu INVITE_EMAIL_FROM để gửi email mời')
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

export async function sendGiftAddedEmail(payload: GiftAddedEmailPayload): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.INVITE_EMAIL_FROM

  if (!from) {
    throw new Error('Thiếu INVITE_EMAIL_FROM để gửi email thông báo quà mới')
  }

  const anhEmail = normalizeEmail(payload.anhEmail)
  const emEmail = normalizeEmail(payload.emEmail)
  const subject = `Em vừa thêm quà mới: ${payload.giftName}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Em vừa thêm một món quà mới</h2>
      <p><strong>${escapeHtml(emEmail)}</strong> vừa thêm quà mới vào wishbook của hai bạn.</p>
      <ul>
        <li><strong>Tên quà:</strong> ${escapeHtml(payload.giftName)}</li>
        <li><strong>Danh mục:</strong> ${escapeHtml(payload.category)}</li>
        <li><strong>Tầm giá:</strong> ${escapeHtml(payload.budgetRange)}</li>
        <li><strong>Mức độ mong muốn:</strong> ${escapeHtml(payload.desireLevel)}</li>
      </ul>
      ${payload.sampleUrl ? `<p><strong>Link mẫu:</strong> <a href="${escapeHtml(payload.sampleUrl)}">${escapeHtml(payload.sampleUrl)}</a></p>` : ''}
      <p>
        <a href="${escapeHtml(payload.giftListUrl)}" style="display:inline-block;padding:10px 16px;background:#d74f72;color:#fff;text-decoration:none;border-radius:8px">
          Xem danh sách quà
        </a>
      </p>
    </div>
  `

  try {
    await transporter.sendMail({
      from,
      to: anhEmail,
      subject,
      html,
      replyTo: emEmail,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Gửi email thất bại: ${message}`)
  }
}

export async function sendInviteAcceptedEmail(payload: InviteAcceptedEmailPayload): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.INVITE_EMAIL_FROM

  if (!from) {
    throw new Error('Thiếu INVITE_EMAIL_FROM để gửi email xác nhận tham gia couple')
  }

  const anhEmail = normalizeEmail(payload.anhEmail)
  const emEmail = normalizeEmail(payload.emEmail)
  const subject = `${payload.coupleName}: em đã xác nhận lời mời`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Em đã vào couple thành công</h2>
      <p><strong>${escapeHtml(emEmail)}</strong> đã xác nhận lời mời và tham gia couple <strong>${escapeHtml(payload.coupleName)}</strong>.</p>
      <p>Bây giờ em có thể thêm quà mới, còn anh có thể xem danh sách quà.</p>
      <p>
        <a href="${escapeHtml(payload.giftListUrl)}" style="display:inline-block;padding:10px 16px;background:#d74f72;color:#fff;text-decoration:none;border-radius:8px">
          Mở danh sách quà
        </a>
      </p>
    </div>
  `

  try {
    await transporter.sendMail({
      from,
      to: anhEmail,
      subject,
      html,
      replyTo: emEmail,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Gửi email thất bại: ${message}`)
  }
}

export async function sendComfortAlertEmail(payload: ComfortAlertEmailPayload): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.INVITE_EMAIL_FROM

  if (!from) {
    throw new Error('Thiếu INVITE_EMAIL_FROM để gửi email báo anh dỗ em')
  }

  const anhEmail = normalizeEmail(payload.anhEmail)
  const emEmail = normalizeEmail(payload.emEmail)
  const subject = 'Quan trọng: Em đang giận đấy, dỗ em đi'
  const text = `${emEmail} vừa gửi tín hiệu SOS từ couple ${payload.coupleName}. Mau vào Love Presents để dỗ em đi nhé: ${payload.appUrl}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Em đang giận đấy, dỗ em đi</h2>
      <p><strong>${escapeHtml(emEmail)}</strong> vừa bấm nút cầu cứu trong couple <strong>${escapeHtml(payload.coupleName)}</strong>.</p>
      <p>Email này được gửi với mức ưu tiên cao để anh biết là đã đến lúc dỗ em thật tử tế rồi.</p>
      <p>
        <a href="${escapeHtml(payload.appUrl)}" style="display:inline-block;padding:10px 16px;background:#d74f72;color:#fff;text-decoration:none;border-radius:8px">
          Mở Love Presents ngay
        </a>
      </p>
      <p>Gợi ý nhẹ: hỏi han, xin lỗi nếu cần, rồi dẫn em đi ăn món ngon nha.</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from,
      to: anhEmail,
      subject,
      text,
      html,
      replyTo: emEmail,
      priority: 'high',
      headers: {
        Importance: 'high',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Gửi email thất bại: ${message}`)
  }
}

function createTransporter() {
  const smtpUser = process.env.GMAIL_SMTP_USER
  const smtpAppPassword = process.env.GMAIL_SMTP_APP_PASSWORD

  if (!smtpUser || !smtpAppPassword) {
    throw new Error('Thiếu GMAIL_SMTP_USER hoặc GMAIL_SMTP_APP_PASSWORD để gửi email')
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

import type { MouseEvent } from 'react'

interface HomePageProps {
  theme: 'romantic' | 'anniversary'
  onToggleTheme: () => void
  onOpenLogin: () => void
}

export function HomePage({ theme, onToggleTheme, onOpenLogin }: HomePageProps) {
  function handleStart(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    onOpenLogin()
  }

  return (
    <main className="entry-wrap">
      <div className="entry-glow entry-glow-a" aria-hidden="true" />
      <div className="entry-glow entry-glow-b" aria-hidden="true" />

      <section className="entry-hero">
        <button className="entry-theme-toggle" type="button" onClick={onToggleTheme}>
          {theme === 'anniversary' ? '🎀 Chế độ lãng mạn' : '🎉 Chế độ kỷ niệm'}
        </button>

        <p className="entry-chip">Love Presents</p>
        <h1 className="entry-title">Nơi hai bạn lưu lại quà tặng và chọn món ăn cho hôm nay</h1>
        <p className="entry-subtitle">
          Đăng nhập Google, tạo couple, mời người thương và cùng nhau xây wishbook.
          Mở thêm vòng quay may mắn để chốt nhanh câu hỏi: hôm nay ăn gì?
        </p>

        <div className="entry-actions">
          <button type="button" className="btn btn-primary" onClick={handleStart}>
            Bắt đầu ngay
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleStart}>
            Đăng nhập Google
          </button>
        </div>
      </section>

      <section className="entry-features">
        <article className="entry-feature-card">
          <p className="entry-feature-icon">💞</p>
          <h3>Quản lý theo couple</h3>
          <p>Mỗi tài khoản chỉ thuộc một couple. Anh mời em qua email xác nhận rõ ràng.</p>
        </article>

        <article className="entry-feature-card">
          <p className="entry-feature-icon">🎁</p>
          <h3>Wishbook riêng tư</h3>
          <p>Em thêm quà nhanh, anh theo dõi danh sách và nhận thông báo qua email khi có quà mới.</p>
        </article>

        <article className="entry-feature-card">
          <p className="entry-feature-icon">🍜</p>
          <h3>Vòng quay hôm nay ăn gì</h3>
          <p>Chia 2 mức Bình dân và Đắt đỏ, quay một phát là chốt luôn địa điểm ăn uống.</p>
        </article>
      </section>
    </main>
  )
}

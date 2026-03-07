import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { GiftsProvider } from './hooks/useGifts'
import { LoginPage } from './pages/LoginPage'
import { AddGiftPage } from './pages/AddGiftPage'
import { GiftListPage } from './pages/GiftListPage'
import { ToastProvider } from './components/ToastProvider'

function Topbar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="/" className="topbar-logo">
          <span className="logo-mark">💝</span>
          <span className="logo-text">Love Presents</span>
        </a>
        <nav className="topbar-nav">
          <NavLink to="/gifts" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>💌 Danh sách</span>
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>✨ Thêm quà</span>
          </NavLink>
          <button className="topbar-logout" onClick={onLogout}>
            🌙 Thoát
          </button>
        </nav>
      </div>
    </header>
  )
}

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />
      <Topbar onLogout={onLogout} />
      <Routes>
        <Route path="/gifts" element={<GiftListPage />} />
        <Route path="/add" element={<AddGiftPage />} />
        <Route path="*" element={<Navigate to="/gifts" replace />} />
      </Routes>
    </div>
  )
}

function AppInner() {
  const { authenticated, checking, login, logout } = useAuth()

  if (checking) {
    return (
      <div className="spinner-wrap spinner-wrap-fullscreen">
        <div className="spinner" />
      </div>
    )
  }

  if (!authenticated) return <LoginPage onLogin={login} />

  return (
    <GiftsProvider>
      <AuthenticatedApp onLogout={() => { void logout() }} />
    </GiftsProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BrowserRouter>
  )
}

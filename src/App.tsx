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
          💝 <span>Love Presents</span>
        </a>
        <nav className="topbar-nav">
          <NavLink to="/gifts" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>Danh sách</span>
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>Thêm quà</span>
          </NavLink>
          <button className="topbar-logout" onClick={onLogout}>
            Thoát
          </button>
        </nav>
      </div>
    </header>
  )
}

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-shell">
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
  const { authenticated, checking, logout } = useAuth()

  if (checking) {
    return (
      <div className="spinner-wrap" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!authenticated) return <LoginPage />

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

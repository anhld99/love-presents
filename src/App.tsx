import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { GiftsProvider } from './hooks/useGifts'
import { LoginPage } from './pages/LoginPage'
import { AddGiftPage } from './pages/AddGiftPage'
import { GiftListPage } from './pages/GiftListPage'
import { ToastProvider } from './components/ToastProvider'

type ThemeVariant = 'romantic' | 'anniversary'

const THEME_STORAGE_KEY = 'lp-theme-variant'
const DEFAULT_THEME: ThemeVariant = import.meta.env.VITE_THEME_VARIANT === 'anniversary' ? 'anniversary' : 'romantic'

function getInitialTheme(): ThemeVariant {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'anniversary' || stored === 'romantic' ? stored : DEFAULT_THEME
}

function Topbar({
  onLogout,
  theme,
  onToggleTheme,
}: {
  onLogout: () => void
  theme: ThemeVariant
  onToggleTheme: () => void
}) {
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
          <button className="topbar-theme" onClick={onToggleTheme}>
            {theme === 'anniversary' ? '🎀 Lãng mạn' : '🎉 Kỷ niệm'}
          </button>
          <button className="topbar-logout" onClick={onLogout}>
            🌙 Thoát
          </button>
        </nav>
      </div>
    </header>
  )
}

function MobileDock({
  onLogout,
  theme,
  onToggleTheme,
}: {
  onLogout: () => void
  theme: ThemeVariant
  onToggleTheme: () => void
}) {
  return (
    <nav className="mobile-dock" aria-label="Điều hướng nhanh">
      <NavLink to="/gifts" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="mobile-dock-icon">💌</span>
        <span className="mobile-dock-label">Danh sách</span>
      </NavLink>
      <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="mobile-dock-icon">✨</span>
        <span className="mobile-dock-label">Thêm quà</span>
      </NavLink>
      <button className="mobile-dock-btn" onClick={onToggleTheme}>
        <span className="mobile-dock-icon">{theme === 'anniversary' ? '🎀' : '🎉'}</span>
        <span className="mobile-dock-label">Theme</span>
      </button>
      <button className="mobile-dock-btn" onClick={onLogout}>
        <span className="mobile-dock-icon">🌙</span>
        <span className="mobile-dock-label">Thoát</span>
      </button>
    </nav>
  )
}

function AuthenticatedApp({
  onLogout,
  theme,
  onToggleTheme,
}: {
  onLogout: () => void
  theme: ThemeVariant
  onToggleTheme: () => void
}) {
  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />
      <Topbar onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
      <Routes>
        <Route path="/gifts" element={<GiftListPage />} />
        <Route path="/add" element={<AddGiftPage />} />
        <Route path="*" element={<Navigate to="/gifts" replace />} />
      </Routes>
      <MobileDock onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  )
}

function AppInner({ theme, onToggleTheme }: { theme: ThemeVariant, onToggleTheme: () => void }) {
  const { authenticated, checking, login, logout } = useAuth()

  if (checking) {
    return (
      <div className="spinner-wrap spinner-wrap-fullscreen">
        <div className="spinner" />
      </div>
    )
  }

  if (!authenticated) {
    return <LoginPage onLogin={login} theme={theme} onToggleTheme={onToggleTheme} />
  }

  return (
    <GiftsProvider>
      <AuthenticatedApp
        onLogout={() => { void logout() }}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </GiftsProvider>
  )
}

export default function App() {
  const [theme, setTheme] = useState<ThemeVariant>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'romantic' ? 'anniversary' : 'romantic')
  }, [])

  return (
    <BrowserRouter>
      <ToastProvider>
        <AppInner theme={theme} onToggleTheme={toggleTheme} />
      </ToastProvider>
    </BrowserRouter>
  )
}

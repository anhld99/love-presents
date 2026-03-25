import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { GiftsProvider } from './hooks/useGifts'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { AddGiftPage } from './pages/AddGiftPage'
import { GiftListPage } from './pages/GiftListPage'
import { ToastProvider } from './components/ToastProvider'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { InviteAcceptPage } from './pages/InviteAcceptPage'
import { CouplePage } from './pages/CouplePage'
import { EatTodayPage } from './pages/EatTodayPage'
import { FoodSpinHistoryPage } from './pages/FoodSpinHistoryPage'
import {
  acceptCoupleInvite,
  cancelCoupleInvite,
  createCouple,
  fetchCoupleStatus,
  fetchCoupleActivity,
  fetchCoupleInvites,
  resendCoupleInvite,
  sendComfortAlert,
  sendCoupleInvite,
  type ComfortAlertResult,
  type CoupleActivity,
  type CoupleInvite,
  type CoupleStatus,
} from './lib/api'

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
  canViewList,
  hasCouple,
}: {
  onLogout: () => void
  theme: ThemeVariant
  onToggleTheme: () => void
  canViewList: boolean
  hasCouple: boolean
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          <span className="logo-mark">💝</span>
          <span className="logo-text">Love Presents</span>
        </Link>
        <nav className="topbar-nav">
          {hasCouple && canViewList && (
            <NavLink to="/gifts" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>💌 Danh sách</span>
            </NavLink>
          )}
          {hasCouple && (
            <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>✨ Thêm quà</span>
            </NavLink>
          )}
          {hasCouple && (
            <NavLink to="/eat" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>🍜 Hôm nay ăn gì</span>
            </NavLink>
          )}
          {!hasCouple && (
            <NavLink to="/couple" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>💞 Couple</span>
            </NavLink>
          )}
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
  canViewList,
  hasCouple,
}: {
  onLogout: () => void
  canViewList: boolean
  hasCouple: boolean
}) {
  const itemCount = (hasCouple && canViewList ? 1 : 0) + (hasCouple ? 1 : 0) + (hasCouple ? 1 : 0) + (!hasCouple ? 1 : 0) + 1

  return (
    <nav className={`mobile-dock columns-${itemCount}`} aria-label="Điều hướng nhanh">
      {canViewList && hasCouple && (
        <NavLink to="/gifts" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="mobile-dock-icon">💌</span>
          <span className="mobile-dock-label">Danh sách</span>
        </NavLink>
      )}
      {hasCouple && (
        <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="mobile-dock-icon">✨</span>
          <span className="mobile-dock-label">Thêm quà</span>
        </NavLink>
      )}
      {hasCouple && (
        <NavLink to="/eat" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="mobile-dock-icon">🍜</span>
          <span className="mobile-dock-label">Ăn gì</span>
        </NavLink>
      )}
      {!hasCouple && (
        <NavLink to="/couple" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="mobile-dock-icon">💞</span>
          <span className="mobile-dock-label">Couple</span>
        </NavLink>
      )}
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
  canViewList,
  hasCouple,
  role,
  email,
  onCreateCouple,
  onInviteEm,
  onSendComfortAlert,
  onFetchCoupleStatus,
  onFetchInvites,
  onResendInvite,
  onCancelInvite,
  onFetchActivity,
}: {
  onLogout: () => void
  theme: ThemeVariant
  onToggleTheme: () => void
  canViewList: boolean
  hasCouple: boolean
  role: 'anh' | 'em' | null
  email: string | null
  onCreateCouple: (name: string) => Promise<void>
  onInviteEm: (email: string) => Promise<void>
  onSendComfortAlert: () => Promise<ComfortAlertResult>
  onFetchCoupleStatus: () => Promise<CoupleStatus>
  onFetchInvites: () => Promise<CoupleInvite[]>
  onResendInvite: (inviteId: string) => Promise<void>
  onCancelInvite: (inviteId: string) => Promise<void>
  onFetchActivity: () => Promise<CoupleActivity[]>
}) {
  return (
    <div className="app-shell">
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />
      <Topbar
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        canViewList={canViewList}
        hasCouple={hasCouple}
      />
      <Routes>
        <Route
          path="/gifts"
          element={hasCouple ? (canViewList ? <GiftListPage /> : <Navigate to="/add" replace />) : <Navigate to="/couple" replace />}
        />
        <Route path="/add" element={hasCouple ? <AddGiftPage /> : <Navigate to="/couple" replace />} />
        <Route path="/eat" element={hasCouple ? <EatTodayPage role={role} email={email} /> : <Navigate to="/couple" replace />} />
        <Route path="/eat-history" element={hasCouple ? <FoodSpinHistoryPage /> : <Navigate to="/couple" replace />} />
        <Route
          path="/couple"
          element={
            <CouplePage
              hasCouple={hasCouple}
              role={role}
              email={email}
              onCreateCouple={onCreateCouple}
              onInviteEm={onInviteEm}
              onSendComfortAlert={onSendComfortAlert}
              onFetchCoupleStatus={onFetchCoupleStatus}
              onFetchInvites={onFetchInvites}
              onResendInvite={onResendInvite}
              onCancelInvite={onCancelInvite}
              onFetchActivity={onFetchActivity}
            />
          }
        />
        <Route path="*" element={<Navigate to={!hasCouple ? '/couple' : canViewList ? '/gifts' : '/add'} replace />} />
      </Routes>
      <MobileDock
        onLogout={onLogout}
        canViewList={canViewList}
        hasCouple={hasCouple}
      />
    </div>
  )
}

function AppInner({ theme, onToggleTheme }: { theme: ThemeVariant, onToggleTheme: () => void }) {
  const navigate = useNavigate()
  const {
    authenticated,
    checking,
    startGoogleLogin,
    finishGoogleLogin,
    refreshSession,
    logout,
    role,
    hasCouple,
    email,
  } = useAuth()

  const canViewList = role === 'anh'
  const appHomePath = !hasCouple ? '/couple' : canViewList ? '/gifts' : '/add'

  const handleCreateCouple = useCallback(async (name: string) => {
    await createCouple(name)
    await refreshSession()
  }, [refreshSession])

  const handleInviteEm = useCallback(async (inviteEmail: string) => {
    await sendCoupleInvite(inviteEmail)
  }, [])

  const handleSendComfortAlert = useCallback(async () => {
    return await sendComfortAlert()
  }, [])

  const handleFetchCoupleStatus = useCallback(async () => {
    return await fetchCoupleStatus()
  }, [])

  const handleFetchInvites = useCallback(async () => {
    return await fetchCoupleInvites()
  }, [])

  const handleResendInvite = useCallback(async (inviteId: string) => {
    await resendCoupleInvite(inviteId)
  }, [])

  const handleCancelInvite = useCallback(async (inviteId: string) => {
    await cancelCoupleInvite(inviteId)
  }, [])

  const handleFetchActivity = useCallback(async () => {
    return await fetchCoupleActivity()
  }, [])

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage onComplete={finishGoogleLogin} />} />
      <Route
        path="/invite/accept"
        element={
          <InviteAcceptPage
            authenticated={authenticated}
            checking={checking}
            onStartGoogleLogin={startGoogleLogin}
            onAcceptInvite={acceptCoupleInvite}
            onRefreshSession={refreshSession}
          />
        }
      />

      {checking && (
        <Route
          path="*"
          element={
            <div className="spinner-wrap spinner-wrap-fullscreen">
              <div className="spinner" />
            </div>
          }
        />
      )}

      {!checking && authenticated && (
        <>
          <Route
            path="/"
            element={
              <HomePage
                theme={theme}
                onToggleTheme={onToggleTheme}
                loggedIn
                onOpenLogin={() => {
                  navigate(appHomePath)
                }}
              />
            }
          />
          <Route
            path="/*"
            element={
              <GiftsProvider canReadList={hasCouple && canViewList}>
                <AuthenticatedApp
                  onLogout={() => { void logout() }}
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  canViewList={canViewList}
                  hasCouple={hasCouple}
                  role={role}
                  email={email}
                  onCreateCouple={handleCreateCouple}
                  onInviteEm={handleInviteEm}
                  onSendComfortAlert={handleSendComfortAlert}
                  onFetchCoupleStatus={handleFetchCoupleStatus}
                  onFetchInvites={handleFetchInvites}
                  onResendInvite={handleResendInvite}
                  onCancelInvite={handleCancelInvite}
                  onFetchActivity={handleFetchActivity}
                />
              </GiftsProvider>
            }
          />
        </>
      )}

      {!checking && !authenticated && (
        <>
          <Route
            path="/"
            element={<HomePage theme={theme} onToggleTheme={onToggleTheme} onOpenLogin={() => { void startGoogleLogin('/') }} />}
          />
          <Route path="/login" element={<LoginPage onLogin={() => startGoogleLogin('/')} theme={theme} onToggleTheme={onToggleTheme} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
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

import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Camera, ParkingSquare, History, BarChart3,
  Cpu, Bell, Settings, LogOut, Menu, X, ChevronRight,
  User, Shield, CalendarCheck, Info, Sun, Moon, Wifi, WifiOff,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useParkingStore } from '../store/parkingStore'
import { useThemeStore } from '../store/themeStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { usePolling } from '../hooks/usePolling'
import { dashboardAPI, notificationAPI } from '../services/api'
import NotificationPanel from '../components/NotificationPanel'
import clsx from 'clsx'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/camera', label: 'Live Camera', icon: Camera },
  { path: '/parking', label: 'Parking', icon: ParkingSquare },
  { path: '/history', label: 'History', icon: History },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/iot', label: 'IoT Sensors', icon: Cpu },
  { path: '/reservations', label: 'Reservations', icon: CalendarCheck },
]

const adminItems = [
  { path: '/admin', label: 'Admin', icon: Shield },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuthStore()
  const { stats, setStats, wsConnected, demoMode } = useParkingStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()

  // Connect WebSocket
  useWebSocket()

  // Poll dashboard stats every 3s
  usePolling(async () => {
    try {
      const res = await dashboardAPI.getStats()
      setStats(res.data)
    } catch { /* ignore */ }
  }, 3000)

  // Poll notification count every 10s
  usePolling(async () => {
    try {
      const res = await notificationAPI.unreadCount()
      setUnreadCount(res.data.count)
    } catch { /* ignore */ }
  }, 10000)

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={clsx('flex h-screen overflow-hidden', dark ? 'dark' : '')}>
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-navy-800/95 border-r border-slate-700/50 backdrop-blur-xl transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <ParkingSquare size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">SmartPark</span>
              <span className="text-cyan-400 font-bold text-lg">AI</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-10">Park Smarter. Detect Faster.</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* System status */}
        <div className="px-4 py-3 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {wsConnected
                ? <><span className="pulse-dot green" /><span className="text-xs text-green-400 font-medium">SYSTEM ONLINE</span></>
                : <><span className="pulse-dot gray" /><span className="text-xs text-slate-400">CONNECTING...</span></>
              }
            </div>
            {demoMode && <span className="demo-badge">DEMO</span>}
          </div>
          {stats && (
            <div className="flex gap-3 mt-2 text-xs text-slate-400">
              <span className="text-green-400">{stats.available_slots} free</span>
              <span>·</span>
              <span className="text-red-400">{stats.occupied_slots} busy</span>
              <span>·</span>
              <span>{stats.occupancy_rate}%</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={12} className="ml-auto opacity-40" />
            </NavLink>
          ))}

          <div className="pt-3 border-t border-slate-700/30 mt-3">
            <p className="text-xs text-slate-500 px-3 mb-2 font-medium uppercase tracking-wider">System</p>
            {adminItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx('nav-item', isActive && 'active')}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 lg:px-6 bg-navy-800/80 border-b border-slate-700/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-400">
              {wsConnected
                ? <Wifi size={14} className="text-green-400" />
                : <WifiOff size={14} className="text-slate-500" />
              }
              <span className={wsConnected ? 'text-green-400' : 'text-slate-500'}>
                {wsConnected ? 'Real-time connected' : 'Reconnecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationPanel
                  onClose={() => setNotifOpen(false)}
                  onRead={() => setUnreadCount(0)}
                />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex-shrink-0 flex border-t border-slate-700/50 bg-navy-800/95">
          {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => clsx(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-cyan-400' : 'text-slate-500'
              )}
            >
              <Icon size={18} />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

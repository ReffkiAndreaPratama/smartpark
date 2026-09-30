import { useEffect, useState } from 'react'
import { X, Bell, CheckCheck } from 'lucide-react'
import { notificationAPI } from '../services/api'
import type { Notification } from '../types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface Props {
  onClose: () => void
  onRead: () => void
}

const typeIcon: Record<string, string> = {
  info: '🔵',
  success: '🟢',
  warning: '⚠️',
  error: '🔴',
}

export default function NotificationPanel({ onClose, onRead }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    notificationAPI.list().then((r) => setNotifications(r.data)).catch(() => {})
  }, [])

  const markAll = async () => {
    await notificationAPI.markAllRead()
    setNotifications((n) => n.map((x) => ({ ...x, is_read: true })))
    onRead()
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 card border border-slate-700/50 shadow-2xl z-50 animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Notifications</span>
          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
            {notifications.filter((n) => !n.is_read).length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAll} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <CheckCheck size={12} /> All read
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={clsx(
                'flex gap-3 p-3 border-b border-slate-700/30 hover:bg-white/5 cursor-pointer transition-colors',
                !n.is_read && 'bg-white/5'
              )}
              onClick={() => notificationAPI.markRead(n.id)}
            >
              <span className="text-sm mt-0.5">{typeIcon[n.type] || '🔵'}</span>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium truncate', n.is_read ? 'text-slate-400' : 'text-white')}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

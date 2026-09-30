import { useState } from 'react'
import { Settings, Sun, Moon, Bell, Shield, Database, Palette } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

export default function SettingsPage() {
  const { dark, toggle } = useThemeStore()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState({ slotChange: true, sensorOffline: true, reservationReminder: true })

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Application preferences &amp; configuration</p>
      </div>

      {/* Appearance */}
      <Section icon={<Palette size={16} className="text-purple-400" />} title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">Dark Mode</p>
            <p className="text-xs text-slate-400">Use dark color scheme</p>
          </div>
          <button
            onClick={toggle}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors duration-200',
              dark ? 'bg-cyan-500' : 'bg-slate-600'
            )}
          >
            <span className={clsx(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 flex items-center justify-center',
              dark ? 'translate-x-5' : 'translate-x-0.5'
            )}>
              {dark ? <Moon size={10} className="text-navy-900" /> : <Sun size={10} className="text-yellow-500" />}
            </span>
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={<Bell size={16} className="text-yellow-400" />} title="Notifications">
        {[
          { key: 'slotChange', label: 'Slot Status Changes', desc: 'Notify when a parking slot changes status' },
          { key: 'sensorOffline', label: 'Sensor Offline', desc: 'Alert when a sensor goes offline' },
          { key: 'reservationReminder', label: 'Reservation Reminders', desc: 'Remind 15 minutes before reservation' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <button
              onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
              className={clsx(
                'w-10 h-5 rounded-full transition-colors',
                notifications[key as keyof typeof notifications] ? 'bg-cyan-500' : 'bg-slate-600'
              )}
            >
              <span className={clsx(
                'block w-4 h-4 bg-white rounded-full transition-transform mx-0.5',
                notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>
        ))}
      </Section>

      {/* Account */}
      <Section icon={<Shield size={16} className="text-blue-400" />} title="Account">
        {[
          { label: 'Name', value: user?.name },
          { label: 'Email', value: user?.email },
          { label: 'Role', value: user?.role },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2 border-b border-slate-700/30 last:border-0">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm text-white capitalize">{value}</span>
          </div>
        ))}
      </Section>

      {/* System */}
      <Section icon={<Database size={16} className="text-green-400" />} title="System Info">
        {[
          { label: 'Application', value: 'SmartPark AI v1.0.0' },
          { label: 'Backend', value: 'FastAPI + SQLite' },
          { label: 'Frontend', value: 'React 18 + Tailwind CSS' },
          { label: 'Detection', value: 'YOLO / Demo Mode' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2 border-b border-slate-700/30 last:border-0">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm text-white">{value}</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

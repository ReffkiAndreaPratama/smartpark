import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: string
  loading?: boolean
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-cyan-400', loading }: Props) {
  return (
    <div className="card p-5 flex items-start gap-4 animate-fade-in hover:border-slate-600/70 transition-colors">
      <div className={clsx('p-2.5 rounded-xl bg-white/5', iconColor)}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-700/60 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white leading-none">{value}</p>
        )}
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

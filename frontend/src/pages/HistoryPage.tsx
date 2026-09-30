import { useState, useEffect } from 'react'
import { History, Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { historyAPI } from '../services/api'
import type { HistoryEntry } from '../types'
import { format } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [data, setData] = useState<{ data: HistoryEntry[]; total: number; pages: number }>({ data: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, page_size: 20 }
      if (search) params.slot_code = search
      if (vehicleFilter) params.vehicle_type = vehicleFilter
      if (statusFilter) params.status = statusFilter
      const res = await historyAPI.list(params)
      setData(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, vehicleFilter, statusFilter])
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  const exportCsv = async () => {
    try {
      const res = await historyAPI.exportCsv()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'parking_history.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch { toast.error('Export failed') }
  }

  const formatDuration = (mins: number | null) => {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Parking History</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data.total} total records</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700/50 text-sm font-medium transition-all"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search slot..."
            className="pl-8 pr-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-40"
          />
        </div>
        <select
          value={vehicleFilter}
          onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">All Vehicles</option>
          <option value="car">Car</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="truck">Truck</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Time', 'Slot', 'Zone', 'Vehicle', 'Entry', 'Exit', 'Duration', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/20">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-slate-700/40 rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <History size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No parking history found.</p>
                    <p className="text-xs mt-1">Records will appear after vehicles are detected or sessions are created.</p>
                  </td>
                </tr>
              ) : (
                data.data.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-700/20 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">#{entry.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{entry.slot_code}</td>
                    <td className="px-4 py-3 text-slate-400">Zone {entry.zone}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-300">{entry.vehicle_type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {entry.entry_time ? format(new Date(entry.entry_time), 'HH:mm dd/MM') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {entry.exit_time ? format(new Date(entry.exit_time), 'HH:mm dd/MM') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDuration(entry.duration_minutes)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        entry.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      )}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Page {page} of {data.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

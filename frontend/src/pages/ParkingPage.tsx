import { useEffect, useState } from 'react'
import { ParkingSquare, Plus, Filter, Search, RefreshCw } from 'lucide-react'
import ParkingMap from '../components/ParkingMap'
import { parkingAPI } from '../services/api'
import { useParkingStore } from '../store/parkingStore'
import { useAuthStore } from '../store/authStore'
import type { ParkingSlot } from '../types'
import { usePolling } from '../hooks/usePolling'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function ParkingPage() {
  const { slots, setSlots } = useParkingStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [zoneFilter, setZoneFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSlot, setNewSlot] = useState({ slot_code: '', zone: 'A', slot_type: 'car', floor: 'G' })

  const load = async () => {
    try {
      const params: Record<string, string> = {}
      if (zoneFilter !== 'all') params.zone = zoneFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await parkingAPI.list(params)
      setSlots(res.data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [zoneFilter, statusFilter])
  usePolling(load, 5000)

  const zones = [...new Set(slots.map((s) => s.zone))].sort()

  const filtered = slots.filter((s) =>
    !search || s.slot_code.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === 'available').length,
    occupied: slots.filter((s) => s.status === 'occupied').length,
    reserved: slots.filter((s) => s.status === 'reserved').length,
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await parkingAPI.create(newSlot)
      setSlots([...slots, res.data])
      setShowAddModal(false)
      toast.success(`Slot ${res.data.slot_code} created`)
      setNewSlot({ slot_code: '', zone: 'A', slot_type: 'car', floor: 'G' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create slot')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Parking Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage and monitor all parking slots</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-slate-700/50 transition-all">
            <RefreshCw size={15} />
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} /> Add Slot
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Available', value: stats.available, color: 'text-green-400' },
          { label: 'Occupied', value: stats.occupied, color: 'text-red-400' },
          { label: 'Reserved', value: stats.reserved, color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search slot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-40"
          />
        </div>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Zones</option>
          {zones.map((z) => <option key={z} value={z}>Zone {z}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>

        <span className="text-xs text-slate-500 ml-2">{filtered.length} slots</span>
      </div>

      {/* Map */}
      <div className="card p-5">
        {loading ? (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-700/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <ParkingMap slots={filtered} />
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-5">Add Parking Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-4">
              {[
                { label: 'Slot ID', key: 'slot_code', type: 'text', placeholder: 'e.g. A11' },
                { label: 'Floor', key: 'floor', type: 'text', placeholder: 'G' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={newSlot[key as keyof typeof newSlot]}
                    onChange={(e) => setNewSlot((s) => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Zone</label>
                <select
                  value={newSlot.zone}
                  onChange={(e) => setNewSlot((s) => ({ ...s, zone: e.target.value }))}
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  {['A', 'B', 'C', 'D', 'VIP'].map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Type</label>
                <select
                  value={newSlot.slot_type}
                  onChange={(e) => setNewSlot((s) => ({ ...s, slot_type: e.target.value }))}
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-slate-300 text-sm border border-slate-700/50 hover:bg-white/10">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

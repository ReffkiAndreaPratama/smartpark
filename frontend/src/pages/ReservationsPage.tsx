import { useEffect, useState } from 'react'
import { CalendarCheck, Plus, X, Car } from 'lucide-react'
import { reservationAPI, parkingAPI } from '../services/api'
import type { Reservation, ParkingSlot } from '../types'
import { format } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    slot_id: 0,
    vehicle_type: 'car',
    start_time: '',
    end_time: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      reservationAPI.list(),
      parkingAPI.list({ status: 'available' }),
    ]).then(([r, s]) => {
      setReservations(r.data)
      setSlots(s.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slot_id || !form.start_time || !form.end_time) return toast.error('Fill in all required fields')
    try {
      const res = await reservationAPI.create(form)
      setReservations([res.data, ...reservations])
      setShowModal(false)
      toast.success('Reservation created!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Reservation failed')
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this reservation?')) return
    try {
      await reservationAPI.cancel(id)
      setReservations((r) => r.filter((x) => x.id !== id))
      toast.success('Reservation cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservations</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage parking slot reservations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors"
        >
          <Plus size={14} /> Reserve Slot
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-700/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarCheck size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No reservations yet.</p>
          <p className="text-xs text-slate-500 mt-1">Reserve a parking slot to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Car size={16} className="text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold">Slot #{r.slot_id}</p>
                  <span className={clsx('text-xs px-2 py-0.5 rounded font-medium capitalize', statusColor[r.status] || 'bg-slate-500/20 text-slate-400')}>
                    {r.status}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{r.vehicle_type}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(r.start_time), 'dd MMM HH:mm')} → {format(new Date(r.end_time), 'dd MMM HH:mm')}
                </p>
                {r.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.notes}</p>}
              </div>
              {r.status === 'pending' && (
                <button
                  onClick={() => handleCancel(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-5">Reserve Parking Slot</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Parking Slot *</label>
                <select
                  value={form.slot_id}
                  onChange={(e) => setForm((f) => ({ ...f, slot_id: Number(e.target.value) }))}
                  required
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value={0}>Select a slot...</option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>{s.slot_code} — Zone {s.zone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))}
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Start Time *</label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  required
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">End Time *</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  required
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg bg-white/5 text-slate-300 text-sm border border-slate-700/50 hover:bg-white/10">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold">Reserve</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

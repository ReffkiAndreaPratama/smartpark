import { useState } from 'react'
import type { ParkingSlot } from '../types'
import SlotCard, { SlotDetailModal } from './SlotCard'
import { parkingAPI } from '../services/api'
import { useParkingStore } from '../store/parkingStore'
import toast from 'react-hot-toast'

interface Props {
  slots: ParkingSlot[]
  compact?: boolean
}

export default function ParkingMap({ slots, compact = false }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const { updateSlot } = useParkingStore()

  const zones = [...new Set(slots.map((s) => s.zone))].sort()

  const handleToggle = async (slot: ParkingSlot) => {
    try {
      const res = await parkingAPI.toggleOccupy(slot.id, slot.vehicle_type || 'car')
      updateSlot(slot.slot_code, { status: res.data.status })
      toast.success(`Slot ${slot.slot_code} → ${res.data.status}`)
    } catch {
      toast.error('Failed to update slot')
    }
  }

  return (
    <>
      <div className="space-y-5">
        {zones.map((zone) => {
          const zoneSlots = slots.filter((s) => s.zone === zone)
          const available = zoneSlots.filter((s) => s.status === 'available').length
          return (
            <div key={zone}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Zone {zone}</span>
                  <span className="text-xs text-slate-500">({zoneSlots.length} slots)</span>
                </div>
                <span className="text-xs text-green-400">{available} available</span>
              </div>
              <div className={compact
                ? 'grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5'
                : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2'
              }>
                {zoneSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    compact={compact}
                    onClick={() => setSelectedSlot(slot)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <SlotDetailModal
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onToggle={handleToggle}
      />
    </>
  )
}

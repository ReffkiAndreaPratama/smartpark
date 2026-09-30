import { useState } from 'react'
import clsx from 'clsx'
import type { ParkingSlot } from '../types'
import { Car, Bike, Truck, Clock, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  slot: ParkingSlot
  onClick?: (slot: ParkingSlot) => void
  onToggle?: (slot: ParkingSlot) => void
  compact?: boolean
}

const vehicleIcon = (type: string | null) => {
  if (type === 'motorcycle') return <Bike size={12} />
  if (type === 'truck') return <Truck size={12} />
  return <Car size={12} />
}

const statusClass: Record<string, string> = {
  available: 'slot-available',
  occupied: 'slot-occupied',
  reserved: 'slot-reserved',
  error: 'slot-error',
}

const statusDot: Record<string, string> = {
  available: 'bg-green-400',
  occupied: 'bg-red-400',
  reserved: 'bg-yellow-400',
  error: 'bg-orange-400',
}

export default function SlotCard({ slot, onClick, onToggle, compact = false }: Props) {
  return (
    <div
      className={clsx(
        'relative border rounded-xl cursor-pointer transition-all duration-200 select-none',
        statusClass[slot.status] || 'slot-available',
        compact ? 'p-2' : 'p-3'
      )}
      onClick={() => onClick?.(slot)}
    >
      {/* Status indicator */}
      <div className={clsx('absolute top-2 right-2 w-2 h-2 rounded-full', statusDot[slot.status])} />

      {/* Slot code */}
      <p className={clsx('font-bold text-white', compact ? 'text-xs' : 'text-sm')}>{slot.slot_code}</p>

      {!compact && (
        <>
          {/* Status badge */}
          <div className="mt-1.5 flex items-center gap-1">
            {slot.status === 'available' && (
              <span className="text-xs font-medium text-green-400">● Available</span>
            )}
            {slot.status === 'occupied' && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                {vehicleIcon(slot.vehicle_type)}
                <span className="capitalize">{slot.vehicle_type || 'occupied'}</span>
              </span>
            )}
            {slot.status === 'reserved' && (
              <span className="text-xs font-medium text-yellow-400">● Reserved</span>
            )}
            {slot.status === 'error' && (
              <span className="text-xs font-medium text-orange-400">⚠ Error</span>
            )}
          </div>

          {/* Confidence */}
          {slot.vehicle_confidence && (
            <p className="text-xs text-slate-500 mt-0.5">{Math.round(slot.vehicle_confidence * 100)}% conf.</p>
          )}

          {/* Duration */}
          {slot.occupied_at && slot.status === 'occupied' && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <Clock size={10} />
              {formatDistanceToNow(new Date(slot.occupied_at))}
            </p>
          )}
        </>
      )}

      {compact && (
        <div className={clsx(
          'mt-0.5 w-full h-0.5 rounded',
          slot.status === 'available' ? 'bg-green-400' :
          slot.status === 'occupied' ? 'bg-red-400' :
          slot.status === 'reserved' ? 'bg-yellow-400' : 'bg-orange-400'
        )} />
      )}
    </div>
  )
}

// ─── Slot Detail Modal ─────────────────────────────────────────────────────
interface ModalProps {
  slot: ParkingSlot | null
  onClose: () => void
  onToggle?: (slot: ParkingSlot) => void
}

export function SlotDetailModal({ slot, onClose, onToggle }: ModalProps) {
  if (!slot) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card p-6 w-full max-w-sm animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Slot {slot.slot_code}</h3>
            <p className="text-xs text-slate-400">Zone {slot.zone} · {slot.slot_type}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <Row label="Status">
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-bold uppercase',
              slot.status === 'available' ? 'status-available' :
              slot.status === 'occupied' ? 'status-occupied' :
              slot.status === 'reserved' ? 'status-reserved' : 'status-error'
            )}>
              {slot.status}
            </span>
          </Row>
          {slot.vehicle_type && <Row label="Vehicle"><span className="text-white capitalize">{slot.vehicle_type}</span></Row>}
          {slot.vehicle_confidence && (
            <Row label="Confidence"><span className="text-white">{Math.round(slot.vehicle_confidence * 100)}%</span></Row>
          )}
          {slot.occupied_at && (
            <Row label="Since">
              <span className="text-white text-sm">{formatDistanceToNow(new Date(slot.occupied_at), { addSuffix: true })}</span>
            </Row>
          )}
          <Row label="Floor"><span className="text-white">{slot.floor}</span></Row>
          <Row label="Type"><span className="text-white capitalize">{slot.slot_type}</span></Row>
        </div>

        {onToggle && (
          <button
            onClick={() => { onToggle(slot); onClose() }}
            className={clsx(
              'mt-5 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
              slot.status === 'occupied'
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
            )}
          >
            {slot.status === 'occupied' ? 'Mark as Available' : 'Mark as Occupied'}
          </button>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/30">
      <span className="text-sm text-slate-400">{label}</span>
      <div>{children}</div>
    </div>
  )
}

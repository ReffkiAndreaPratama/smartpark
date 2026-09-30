import { create } from 'zustand'
import type { ParkingSlot, DashboardStats } from '../types'

interface ParkingStore {
  slots: ParkingSlot[]
  stats: DashboardStats | null
  wsConnected: boolean
  demoMode: boolean
  setSlots: (slots: ParkingSlot[]) => void
  updateSlot: (slotCode: string, update: Partial<ParkingSlot>) => void
  setStats: (stats: DashboardStats) => void
  setWsConnected: (v: boolean) => void
  setDemoMode: (v: boolean) => void
}

export const useParkingStore = create<ParkingStore>((set) => ({
  slots: [],
  stats: null,
  wsConnected: false,
  demoMode: true,
  setSlots: (slots) => set({ slots }),
  updateSlot: (slotCode, update) =>
    set((state) => ({
      slots: state.slots.map((s) =>
        s.slot_code === slotCode ? { ...s, ...update } : s
      ),
    })),
  setStats: (stats) => set({ stats }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  setDemoMode: (demoMode) => set({ demoMode }),
}))

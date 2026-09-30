import { useEffect, useRef, useCallback } from 'react'
import { useParkingStore } from '../store/parkingStore'
import type { ParkingSlot } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const { setWsConnected, updateSlot, setDemoMode } = useParkingStore()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/parking`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        // Keep-alive ping
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping')
        }, 20000)
        ws.addEventListener('close', () => clearInterval(ping))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'pong') return
          if (msg.is_demo !== undefined) setDemoMode(msg.is_demo)

          if (msg.type === 'init' && msg.data) {
            // Initial state: apply all slot statuses
            Object.entries(msg.data).forEach(([slotCode, state]: [string, unknown]) => {
              const s = state as { status: string; vehicle_type: string | null; confidence: number | null }
              updateSlot(slotCode, {
                status: s.status as ParkingSlot['status'],
                vehicle_type: s.vehicle_type,
                vehicle_confidence: s.confidence,
              })
            })
          }

          if (msg.type === 'update' && msg.changed) {
            msg.changed.forEach((change: { slot_code: string; status: string; vehicle_type: string | null; confidence: number | null }) => {
              updateSlot(change.slot_code, {
                status: change.status as ParkingSlot['status'],
                vehicle_type: change.vehicle_type,
                vehicle_confidence: change.confidence,
              })
            })
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }, [setWsConnected, updateSlot, setDemoMode])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}

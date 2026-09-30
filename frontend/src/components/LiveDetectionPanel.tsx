import { useEffect, useState } from 'react'
import { Car, Bike, Truck, Zap, Activity } from 'lucide-react'
import { detectionAPI } from '../services/api'
import type { Detection } from '../types'
import { usePolling } from '../hooks/usePolling'
import clsx from 'clsx'

interface LiveStats {
  cars: number
  motorcycles: number
  trucks: number
  total: number
  fps: number
  avg_confidence: number
  is_demo: boolean
}

export default function LiveDetectionPanel() {
  const [stats, setStats] = useState<LiveStats>({
    cars: 0, motorcycles: 0, trucks: 0, total: 0, fps: 0, avg_confidence: 0, is_demo: true,
  })
  const [recentDetections, setRecentDetections] = useState<Detection[]>([])
  const [modelStatus, setModelStatus] = useState<{ status: string; version: string; is_demo: boolean }>({
    status: 'demo', version: 'Demo', is_demo: true,
  })

  usePolling(async () => {
    try {
      const [detRes, modelRes] = await Promise.all([
        detectionAPI.list(20),
        detectionAPI.modelStatus(),
      ])
      const dets: Detection[] = detRes.data
      setRecentDetections(dets.slice(0, 5))
      setModelStatus(modelRes.data)

      const cars = dets.filter((d) => d.vehicle_type === 'car').length
      const motorcycles = dets.filter((d) => d.vehicle_type === 'motorcycle').length
      const trucks = dets.filter((d) => d.vehicle_type === 'truck').length
      const total = cars + motorcycles + trucks
      const avg_conf = total > 0
        ? dets.reduce((a, d) => a + d.confidence, 0) / dets.length
        : 0

      setStats({
        cars, motorcycles, trucks, total,
        fps: modelRes.data.fps,
        avg_confidence: avg_conf,
        is_demo: modelRes.data.is_demo,
      })
    } catch { /* ignore */ }
  }, 3000)

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Live Detection</span>
        </div>
        {stats.is_demo && <span className="demo-badge">DEMO</span>}
      </div>

      {/* Model status */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Model</span>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded font-medium',
            modelStatus.is_demo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
          )}>
            {modelStatus.is_demo ? 'DEMO' : '● ONLINE'}
          </span>
        </div>
        <p className="text-white text-sm font-semibold">YOLO · {modelStatus.version}</p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-xs text-slate-500">FPS</p>
            <p className="text-sm font-bold text-cyan-400">{stats.fps.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Conf.</p>
            <p className="text-sm font-bold text-cyan-400">
              {stats.avg_confidence > 0 ? `${(stats.avg_confidence * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle counts */}
      <div>
        <p className="text-xs text-slate-400 font-medium mb-2">Vehicles Detected</p>
        <div className="space-y-2">
          <VehicleRow icon={<Car size={13} />} label="Car" count={stats.cars} color="text-blue-400" />
          <VehicleRow icon={<Bike size={13} />} label="Motorcycle" count={stats.motorcycles} color="text-purple-400" />
          <VehicleRow icon={<Truck size={13} />} label="Truck" count={stats.trucks} color="text-orange-400" />
        </div>
        <div className="mt-2 pt-2 border-t border-slate-700/30 flex justify-between">
          <span className="text-xs text-slate-400">Total</span>
          <span className="text-xs font-bold text-white">{stats.total}</span>
        </div>
      </div>

      {/* Recent */}
      {recentDetections.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-medium mb-2">Recent Events</p>
          <div className="space-y-1.5">
            {recentDetections.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  {d.vehicle_type === 'motorcycle' ? <Bike size={11} /> : <Car size={11} />}
                  <span className="capitalize">{d.vehicle_type}</span>
                </div>
                <span className="text-slate-500">{Math.round(d.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VehicleRow({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className={clsx('flex items-center gap-2 text-xs', color)}>
        {icon}
        <span className="text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">{count}</span>
    </div>
  )
}

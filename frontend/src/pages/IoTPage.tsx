import { useState, useEffect } from 'react'
import { Cpu, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { sensorAPI } from '../services/api'
import type { Sensor } from '../types'
import { usePolling } from '../hooks/usePolling'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function IoTPage() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')

  const load = async () => {
    try {
      const res = await sensorAPI.list()
      setSensors(res.data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  usePolling(load, 3000)

  const retry = async (sensorId: string) => {
    try {
      await sensorAPI.retry(sensorId)
      setSensors((s) => s.map((x) => x.sensor_id === sensorId ? { ...x, status: 'online' } : x))
      toast.success(`Sensor ${sensorId} retried`)
    } catch { toast.error('Retry failed') }
  }

  const filtered = sensors.filter((s) => filter === 'all' || s.status === filter)
  const online = sensors.filter((s) => s.status === 'online').length
  const offline = sensors.filter((s) => s.status !== 'online').length
  const occupied = sensors.filter((s) => s.is_occupied).length

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">IoT Sensors</h1>
            <span className="demo-badge">SIMULATED</span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Real-time sensor status monitoring</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-slate-700/50">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: sensors.length, color: 'text-white' },
          { label: 'Online', value: online, color: 'text-green-400' },
          { label: 'Offline', value: offline, color: 'text-red-400' },
          { label: 'Occupied', value: occupied, color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'online', 'offline'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-slate-700/50'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-36 bg-slate-700/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Cpu size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">No sensors found.</p>
          <p className="text-xs text-slate-500 mt-1">Sensors are added automatically when parking slots are created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((sensor) => (
            <SensorCard key={sensor.sensor_id} sensor={sensor} onRetry={() => retry(sensor.sensor_id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function SensorCard({ sensor, onRetry }: { sensor: Sensor; onRetry: () => void }) {
  const isOnline = sensor.status === 'online'
  const isOccupied = sensor.is_occupied

  return (
    <div className={clsx(
      'card p-4 border transition-all duration-300',
      !isOnline ? 'border-red-500/30' :
      isOccupied ? 'border-orange-500/30' : 'border-green-500/20'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400')}>
          </div>
          <span className="text-sm font-bold text-white font-mono">{sensor.sensor_id}</span>
        </div>
        <span className="text-xs text-slate-500 capitalize">{sensor.sensor_type}</span>
      </div>

      {/* Status */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg mb-3',
        !isOnline ? 'bg-red-500/10' : isOccupied ? 'bg-orange-500/10' : 'bg-green-500/10'
      )}>
        {!isOnline ? (
          <><WifiOff size={13} className="text-red-400" /><span className="text-xs text-red-400 font-medium">OFFLINE</span></>
        ) : isOccupied ? (
          <><span className="text-sm">🚗</span><span className="text-xs text-orange-400 font-medium">OCCUPIED</span></>
        ) : (
          <><Wifi size={13} className="text-green-400" /><span className="text-xs text-green-400 font-medium">AVAILABLE</span></>
        )}
      </div>

      {/* Reading */}
      {sensor.reading !== null && (
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Distance</span>
          <span className="text-white font-mono">{sensor.reading?.toFixed(2)}m</span>
        </div>
      )}

      {/* Last seen */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">
          {formatDistanceToNow(new Date(sensor.last_seen), { addSuffix: true })}
        </span>
        {!isOnline && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
          >
            <RefreshCw size={10} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

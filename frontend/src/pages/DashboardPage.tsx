import { useEffect, useState } from 'react'
import {
  ParkingSquare, Car, CheckCircle, XCircle, Activity,
  TrendingUp, Clock, BarChart3,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import ParkingMap from '../components/ParkingMap'
import LiveDetectionPanel from '../components/LiveDetectionPanel'
import { OccupancyAreaChart } from '../components/OccupancyChart'
import { parkingAPI, analyticsAPI, sessionAPI } from '../services/api'
import { useParkingStore } from '../store/parkingStore'
import type { ParkingSession } from '../types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function DashboardPage() {
  const { stats, slots, setSlots, demoMode } = useParkingStore()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [recentSessions, setRecentSessions] = useState<ParkingSession[]>([])

  useEffect(() => {
    Promise.all([
      parkingAPI.list(),
      analyticsAPI.get('today'),
      sessionAPI.list({ limit: '8' }),
    ]).then(([slotsRes, analyticsRes, sessionsRes]) => {
      setSlots(slotsRes.data)
      setAnalyticsData(analyticsRes.data)
      setRecentSessions(sessionsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const occupancyColor = (rate: number) =>
    rate > 80 ? 'text-red-400' : rate > 50 ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {demoMode && <span className="demo-badge">DEMO MODE</span>}
          </div>
          <p className="text-slate-400 text-sm mt-0.5">AI-Powered Smart Parking Overview</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400">Live updates every 3s</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Real-time</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Slots"
          value={stats?.total_slots ?? 0}
          subtitle="Parking Capacity"
          icon={ParkingSquare}
          iconColor="text-cyan-400"
          loading={loading}
        />
        <StatCard
          title="Available"
          value={stats?.available_slots ?? 0}
          subtitle={`${stats ? (100 - stats.occupancy_rate).toFixed(0) : 0}% Free`}
          icon={CheckCircle}
          iconColor="text-green-400"
          loading={loading}
        />
        <StatCard
          title="Occupied"
          value={stats?.occupied_slots ?? 0}
          subtitle={`${stats?.occupancy_rate ?? 0}% Occupancy`}
          icon={XCircle}
          iconColor="text-red-400"
          loading={loading}
        />
        <StatCard
          title="Vehicles"
          value={stats?.occupied_slots ?? 0}
          subtitle="Currently Detected"
          icon={Car}
          iconColor="text-blue-400"
          loading={loading}
        />
      </div>

      {/* Occupancy bar */}
      {stats && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Occupancy Rate</span>
            <span className={clsx('text-xl font-bold', occupancyColor(stats.occupancy_rate))}>
              {stats.occupancy_rate}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                stats.occupancy_rate > 80 ? 'bg-red-500' :
                stats.occupancy_rate > 50 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${stats.occupancy_rate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{stats.available_slots} available</span>
            {stats.reserved_slots > 0 && <span>{stats.reserved_slots} reserved</span>}
            <span>{stats.occupied_slots} occupied</span>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Parking Map */}
        <div className="xl:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ParkingSquare size={14} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Live Parking Map</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/50 border border-green-500" />Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/50 border border-red-500" />Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/50 border border-yellow-500" />Reserved</span>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-700/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <ParkingMap slots={slots} compact />
          )}
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          <LiveDetectionPanel />

          {/* Vehicle breakdown */}
          {stats && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car size={14} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Vehicle Breakdown</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Cars', value: stats.vehicle_cars, color: 'bg-blue-500', total: stats.occupied_slots },
                  { label: 'Motorcycles', value: stats.vehicle_motorcycles, color: 'bg-purple-500', total: stats.occupied_slots },
                  { label: 'Trucks', value: stats.vehicle_trucks, color: 'bg-orange-500', total: stats.occupied_slots },
                ].map(({ label, value, color, total }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-500', color)}
                        style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Occupancy trend */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Occupancy Trend (Today)</h3>
          </div>
          <OccupancyAreaChart data={analyticsData?.occupancy_trend || []} loading={loading} />
        </div>

        {/* Recent activity */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No recent activity</p>
            ) : (
              recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                  <div className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    s.status === 'active' ? 'bg-red-500/20' : 'bg-green-500/20'
                  )}>
                    {s.status === 'active' ? <Car size={13} className="text-red-400" /> : <CheckCircle size={13} className="text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      {s.slot?.slot_code || `Slot #${s.slot_id}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.status === 'active' ? 'ENTERED' : 'EXITED'} ·{' '}
                      {formatDistanceToNow(new Date(s.entry_time), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded',
                    s.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  )}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Clock, Car, Download, Brain } from 'lucide-react'
import { analyticsAPI, reportAPI } from '../services/api'
import { OccupancyAreaChart, PeakHoursChart, VehicleDonut } from '../components/OccupancyChart'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type Period = 'today' | 'yesterday' | '7days' | '30days'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [data, setData] = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([analyticsAPI.get(period), analyticsAPI.forecast()])
      .then(([r, f]) => { setData(r.data); setForecast(f.data) })
      .finally(() => setLoading(false))
  }, [period])

  const exportPdf = async () => {
    try {
      const res = await reportAPI.pdf()
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'smartpark_report.pdf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF report exported')
    } catch { toast.error('Export failed') }
  }

  const periodLabels: Record<Period, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Parking performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-white/5 border border-slate-700/50 rounded-lg p-0.5">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  period === p ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700/50 text-sm transition-all"
          >
            <Download size={13} />
            PDF
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: data?.total_sessions ?? '—', icon: Car, color: 'text-blue-400' },
          { label: 'Avg Duration', value: data?.avg_duration_minutes ? `${data.avg_duration_minutes}m` : '—', icon: Clock, color: 'text-purple-400' },
          { label: 'Occupancy Now', value: data?.occupied_now !== undefined ? `${data.occupied_now}/${data.total_slots}` : '—', icon: BarChart3, color: 'text-cyan-400' },
          { label: 'Efficiency', value: data?.parking_efficiency ? `${data.parking_efficiency}%` : '—', icon: TrendingUp, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            {loading ? (
              <div className="h-7 w-20 bg-slate-700/40 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Occupancy trend */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Occupancy Rate</h3>
          </div>
          <OccupancyAreaChart data={data?.occupancy_trend || []} loading={loading} />
        </div>

        {/* Vehicle breakdown */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Vehicle Type Breakdown</h3>
          </div>
          {loading ? (
            <div className="h-40 bg-slate-700/30 rounded animate-pulse" />
          ) : (
            <VehicleDonut data={data?.vehicle_breakdown || {}} />
          )}
        </div>

        {/* Peak hours */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Peak Hours</h3>
          </div>
          {loading ? (
            <div className="h-40 bg-slate-700/30 rounded animate-pulse" />
          ) : (
            <PeakHoursChart data={data?.peak_hours || []} />
          )}
        </div>

        {/* Forecast */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-green-400" />
            <h3 className="text-sm font-semibold text-white">Parking Forecast</h3>
            <span className="text-xs text-slate-500">Next 30 min</span>
          </div>
          {!forecast ? (
            <div className="h-32 bg-slate-700/30 rounded animate-pulse" />
          ) : !forecast.available ? (
            <div className="text-center py-6">
              <Brain size={28} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">{forecast.message}</p>
              {forecast.current_samples !== undefined && (
                <p className="text-xs text-slate-500 mt-2">
                  {forecast.current_samples} / {forecast.required_samples} samples collected
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{forecast.expected_occupancy}%</p>
                <p className="text-sm text-slate-400 mt-1">Expected Occupancy</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-400">{forecast.expected_available}</p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-lg font-bold text-red-400">{forecast.expected_occupied}</p>
                  <p className="text-xs text-slate-500">Occupied</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className={clsx(
                    'text-sm font-bold',
                    forecast.occupancy_level === 'High' ? 'text-red-400' :
                    forecast.occupancy_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  )}>
                    {forecast.occupancy_level}
                  </p>
                  <p className="text-xs text-slate-500">Level</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

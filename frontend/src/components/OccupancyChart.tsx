import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface OccupancyPoint {
  hour: string
  occupancy_rate: number
  occupied: number
  available: number
}

interface Props {
  data: OccupancyPoint[]
  loading?: boolean
}

const COLORS = ['#3b82f6', '#a855f7', '#f97316', '#22c55e']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-800 border border-slate-700/50 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.includes('%') ? `${p.value}%` : p.value}
        </p>
      ))}
    </div>
  )
}

export function OccupancyAreaChart({ data, loading }: Props) {
  if (loading) return <div className="h-48 bg-slate-800/30 rounded-lg animate-pulse" />
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="occupancy_rate"
          name="Occupancy %"
          stroke="#06b6d4"
          fill="url(#occGrad)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function PeakHoursChart({ data }: { data: { hour: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Vehicles" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function VehicleDonut({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No data</div>

  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={65}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

import { useEffect, useState } from 'react'
import { Shield, Users, Camera, Cpu, BarChart3, Activity, Clock } from 'lucide-react'
import { adminAPI, detectionAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { format } from 'date-fns'
import { Navigate } from 'react-router-dom'
import clsx from 'clsx'

export default function AdminPage() {
  const { user } = useAuthStore()
  const [overview, setOverview] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'model'>('overview')

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  useEffect(() => {
    adminAPI.overview().then((r) => setOverview(r.data)).catch(() => {})
    adminAPI.users().then((r) => setUsers(r.data)).catch(() => {})
    adminAPI.logs().then((r) => setLogs(r.data)).catch(() => {})
    detectionAPI.modelStatus().then((r) => setModelStatus(r.data)).catch(() => {})
  }, [])

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'logs', label: 'System Logs', icon: Activity },
    { key: 'model', label: 'AI Model', icon: Cpu },
  ] as const

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Shield size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm">System management &amp; monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-slate-700/50 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Users', value: overview.users, icon: Users, color: 'text-blue-400' },
            { label: 'Parking Slots', value: overview.parking_slots, icon: BarChart3, color: 'text-cyan-400' },
            { label: 'Cameras', value: overview.cameras, icon: Camera, color: 'text-green-400' },
            { label: 'Sensors', value: overview.sensors, icon: Cpu, color: 'text-purple-400' },
            { label: 'Total Sessions', value: overview.total_sessions, icon: Clock, color: 'text-orange-400' },
            { label: 'Active Sessions', value: overview.active_sessions, icon: Activity, color: 'text-red-400' },
            { label: 'Detections', value: overview.total_detections, icon: Cpu, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={color} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['ID', 'Name', 'Email', 'Role', 'Status', 'Created'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-700/20 hover:bg-white/3">
                  <td className="px-4 py-3 text-slate-500 text-xs">#{u.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded font-medium capitalize',
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs', u.is_active ? 'text-green-400' : 'text-red-400')}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['ID', 'Action', 'Description', 'Time'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No logs</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-700/20 hover:bg-white/3">
                  <td className="px-4 py-3 text-slate-500 text-xs">#{log.id}</td>
                  <td className="px-4 py-3 text-cyan-400 text-xs font-mono">{log.action}</td>
                  <td className="px-4 py-3 text-slate-400">{log.description}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {log.timestamp ? format(new Date(log.timestamp), 'dd MMM HH:mm:ss') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Model status */}
      {activeTab === 'model' && modelStatus && (
        <div className="max-w-lg">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Computer Vision Model</h3>
              <span className={clsx(
                'text-sm px-3 py-1 rounded-full font-medium',
                modelStatus.is_demo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
              )}>
                {modelStatus.is_demo ? 'DEMO' : '● LOADED'}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Model', value: modelStatus.model },
                { label: 'Version', value: modelStatus.version },
                { label: 'Status', value: modelStatus.status },
                { label: 'Inference FPS', value: `${modelStatus.fps} FPS` },
                { label: 'Avg Confidence', value: `${(modelStatus.avg_confidence * 100).toFixed(1)}%` },
                { label: 'Last Loaded', value: modelStatus.last_loaded || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-700/30">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">Detected Classes</p>
              <div className="flex flex-wrap gap-2">
                {modelStatus.classes.map((c: string) => (
                  <span key={c} className="px-2.5 py-1 bg-white/5 border border-slate-700/40 rounded-lg text-xs text-slate-300 capitalize">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {modelStatus.is_demo && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-medium">Demo Mode Active</p>
                <p className="text-xs text-slate-400 mt-1">
                  Real YOLO model is not loaded. Place a YOLO model at <code className="bg-slate-700 px-1 rounded">models/yolo.pt</code> and set <code className="bg-slate-700 px-1 rounded">DEMO_MODE=false</code> to enable real detection.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

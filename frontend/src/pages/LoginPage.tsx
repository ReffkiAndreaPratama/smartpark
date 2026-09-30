import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ParkingSquare, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@smartpark.ai')
  const [password, setPassword] = useState('admin123')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-sm animate-slide-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/20">
            <ParkingSquare size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartPark <span className="text-gradient">AI</span></h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Smart Parking Management</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Sign In</h2>
          <p className="text-xs text-slate-400 mb-5">Access your parking management system</p>

          {/* Demo hint */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-5">
            <p className="text-xs text-cyan-400 font-medium">Demo Credentials</p>
            <p className="text-xs text-slate-400 mt-1">Admin: admin@smartpark.ai / admin123</p>
            <p className="text-xs text-slate-400">User: user@smartpark.ai / user123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-colors"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            No account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

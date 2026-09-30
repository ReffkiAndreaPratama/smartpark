import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ParkingSquare, Loader2 } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Fill in all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await authAPI.register(form.name, form.email, form.password)
      setAuth(res.data.user, res.data.access_token)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-4">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="relative w-full max-w-sm animate-slide-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
            <ParkingSquare size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartPark <span className="text-gradient">AI</span></h1>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: '••••••••' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Account'}
            </button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

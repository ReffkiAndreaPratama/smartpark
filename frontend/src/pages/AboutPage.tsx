import { ParkingSquare, Github, Globe, Shield, Cpu, Camera, Database, Zap } from 'lucide-react'

const techStack = [
  { name: 'Computer Vision', icon: Camera, desc: 'Vehicle detection via YOLO / OpenCV', color: 'text-cyan-400' },
  { name: 'YOLO / Ultralytics', icon: Cpu, desc: 'Object detection model (car, motorcycle, truck)', color: 'text-blue-400' },
  { name: 'React 18', icon: Globe, desc: 'Modern frontend with TypeScript', color: 'text-sky-400' },
  { name: 'FastAPI', icon: Zap, desc: 'Async Python backend with OpenAPI docs', color: 'text-green-400' },
  { name: 'SQLite / SQLAlchemy', icon: Database, desc: 'Lightweight database layer', color: 'text-orange-400' },
  { name: 'WebSocket', icon: Zap, desc: 'Real-time bidirectional communication', color: 'text-purple-400' },
  { name: 'Tailwind CSS', icon: Cpu, desc: 'Utility-first responsive styling', color: 'text-teal-400' },
  { name: 'JWT Auth', icon: Shield, desc: 'Secure token-based authentication', color: 'text-red-400' },
]

export default function AboutPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Hero */}
      <div className="card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 70%)',
        }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-5 shadow-lg shadow-cyan-500/20">
            <ParkingSquare size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            SmartPark <span className="text-gradient">AI</span>
          </h1>
          <p className="text-cyan-400 font-semibold mb-3">Park Smarter. Detect Faster.</p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
            SmartPark AI is a smart parking management system powered by Computer Vision and IoT simulation.
            It monitors parking capacity automatically through image/video analysis and sensor data,
            providing real-time occupancy information via an interactive web dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400 font-medium">v1.0.0</span>
            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">MIT License</span>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techStack.map(({ name, icon: Icon, desc, color }) => (
            <div key={name} className="card p-4 flex items-start gap-3 hover:border-slate-600/60 transition-colors">
              <div className={`mt-0.5 ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Key Features</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            'Real-time parking dashboard',
            'YOLO vehicle detection',
            'Parking slot occupancy',
            'IoT sensor simulation',
            'WebSocket real-time updates',
            'Parking history & sessions',
            'Analytics & charts',
            'AI occupancy forecast',
            'Reservation system',
            'Admin management panel',
            'PDF / CSV export',
            'Dark / Light mode',
            'JWT authentication',
            'Demo mode (no camera needed)',
            'Role-based access control',
            'Responsive mobile design',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-300 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-xs text-yellow-400 font-medium mb-1">Demo Mode Notice</p>
        <p className="text-xs text-slate-400">
          This application runs in Demo Mode by default. All vehicle detections, sensor readings,
          and occupancy data are simulated for demonstration purposes. To enable real Computer Vision,
          set <code className="bg-slate-700 px-1 rounded">DEMO_MODE=false</code> and place a YOLO model at <code className="bg-slate-700 px-1 rounded">models/yolo.pt</code>.
        </p>
      </div>
    </div>
  )
}

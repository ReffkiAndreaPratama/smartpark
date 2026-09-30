import { useState, useRef, useEffect } from 'react'
import {
  Camera, Upload, Play, Square, Image as ImageIcon, Zap,
  AlertTriangle, CheckCircle, Loader2, Film,
} from 'lucide-react'
import { detectionAPI, cameraAPI } from '../services/api'
import LiveDetectionPanel from '../components/LiveDetectionPanel'
import type { Camera as CameraType } from '../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type Source = 'demo' | 'webcam' | 'image' | 'video'

interface DetectionResult {
  vehicle_type: string
  confidence: number
  bbox: number[]
  slot_id?: number
  is_demo: boolean
}

export default function CameraPage() {
  const [source, setSource] = useState<Source>('demo')
  const [cameraActive, setCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null)
  const [cameras, setCameras] = useState<CameraType[]>([])
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [demoTick, setDemoTick] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const demoIntervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    cameraAPI.list().then((r) => setCameras(r.data)).catch(() => {})
    detectionAPI.modelStatus().then((r) => setModelStatus(r.data)).catch(() => {})
    startDemo()
    return () => {
      stopCamera()
      clearInterval(demoIntervalRef.current)
    }
  }, [])

  const startDemo = () => {
    setSource('demo')
    setCameraActive(true)
    clearInterval(demoIntervalRef.current)
    demoIntervalRef.current = setInterval(async () => {
      try {
        const res = await detectionAPI.demoSnapshot()
        setDetections(res.data.detections || [])
        setDemoTick((t) => t + 1)
      } catch { /* ignore */ }
    }, 2000)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    clearInterval(demoIntervalRef.current)
  }

  const startWebcam = async () => {
    stopCamera()
    clearInterval(demoIntervalRef.current)
    setSource('webcam')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
      toast.success('Camera connected')
    } catch {
      toast.error('Unable to connect to camera. Starting Demo mode.')
      startDemo()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) return toast.error('File exceeds the 100MB limit.')

    const allowed = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) return toast.error('Unsupported image format. Use jpg or png.')

    stopCamera()
    clearInterval(demoIntervalRef.current)
    setSource('image')
    setCameraActive(false)
    setLoading(true)
    setAnnotatedImage(null)

    const preview = URL.createObjectURL(file)
    setImagePreview(preview)

    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await detectionAPI.detectImage(formData)
      setDetections(res.data.detections || [])
      toast.success(`Detected ${res.data.detections.length} vehicles`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Detection failed')
    } finally {
      setLoading(false)
    }
  }

  const vehicleIcon = (type: string) => {
    if (type === 'motorcycle') return '🏍️'
    if (type === 'truck') return '🚛'
    if (type === 'bus') return '🚌'
    return '🚗'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Camera</h1>
          <p className="text-slate-400 text-sm mt-0.5">Vehicle detection &amp; parking occupancy analysis</p>
        </div>
        {modelStatus && (
          <div className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
            modelStatus.is_demo ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
          )}>
            {modelStatus.is_demo ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
            {modelStatus.is_demo ? 'Demo Detection' : `${modelStatus.version} Active`}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={startDemo}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', source === 'demo' && cameraActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700/50')}
        >
          <Play size={14} />
          Demo Mode
        </button>
        <button
          onClick={startWebcam}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', source === 'webcam' && cameraActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700/50')}
        >
          <Camera size={14} />
          Start Camera
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700/50 transition-all"
        >
          <ImageIcon size={14} />
          Upload Image
        </button>
        {cameraActive && source !== 'image' && (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            <Square size={14} />
            Stop
          </button>
        )}
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Camera view */}
        <div className="xl:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">
                {source === 'demo' ? 'Demo Camera' :
                 source === 'webcam' ? 'Live Camera' :
                 source === 'image' ? 'Image Analysis' : 'Video Analysis'}
              </span>
              {source === 'demo' && <span className="demo-badge">DEMO</span>}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {cameraActive
                ? <span className="flex items-center gap-1 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live</span>
                : <span className="text-slate-500">Offline</span>
              }
            </div>
          </div>

          {/* Video / Demo view */}
          <div className="relative aspect-video bg-slate-900/80 rounded-xl overflow-hidden border border-slate-700/30">
            {source === 'webcam' ? (
              <video ref={videoRef} className="w-full h-full object-cover" muted />
            ) : source === 'image' && imagePreview ? (
              <img src={imagePreview} alt="Analysis" className="w-full h-full object-contain" />
            ) : (
              /* Demo animated parking scene */
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-navy-900 p-6">
                  {/* Simulated parking grid */}
                  <div className="absolute inset-4 grid grid-cols-4 grid-rows-2 gap-3">
                    {['A01','A02','A03','A04','B01','B02','B03','B04'].map((code, i) => {
                      const isOccupied = detections.some((_, di) => di % 8 === i) || (demoTick + i) % 3 === 0
                      return (
                        <div
                          key={code}
                          className={clsx(
                            'rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-500',
                            isOccupied ? 'border-red-500/70 bg-red-500/10' : 'border-green-500/50 bg-green-500/5'
                          )}
                        >
                          <span className="text-xs font-bold text-white/60">{code}</span>
                          {isOccupied && (
                            <div className="mt-1">
                              <span className="text-2xl">🚗</span>
                              <div className="text-xs text-red-400 font-mono text-center">
                                {(85 + i * 2 + demoTick % 5).toFixed(0)}%
                              </div>
                            </div>
                          )}
                          {!isOccupied && <span className="text-xs text-green-400 mt-1">FREE</span>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Detection boxes overlay */}
                  {detections.slice(0, 3).map((d, i) => (
                    <div
                      key={i}
                      className="absolute border-2 border-cyan-400 rounded pointer-events-none animate-pulse"
                      style={{
                        left: `${10 + i * 22}%`,
                        top: `${20 + (i % 2) * 40}%`,
                        width: '18%',
                        height: '30%',
                      }}
                    >
                      <div className="absolute -top-5 left-0 bg-cyan-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                        {d.vehicle_type?.toUpperCase()} {Math.round(d.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-cyan-400 mx-auto mb-3" />
                  <p className="text-white text-sm font-medium">Analyzing parking area...</p>
                  <p className="text-slate-400 text-xs mt-1">Detecting vehicles · Checking parking slots</p>
                </div>
              </div>
            )}
          </div>

          {/* Detected objects list */}
          {detections.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {detections.slice(0, 8).map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-slate-700/30 text-xs"
                >
                  <span>{vehicleIcon(d.vehicle_type)}</span>
                  <span className="text-white capitalize">{d.vehicle_type}</span>
                  <span className="text-cyan-400 font-mono">{Math.round(d.confidence * 100)}%</span>
                  {d.is_demo && <span className="text-yellow-500/70">~</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detection Panel + Camera List */}
        <div className="space-y-4">
          <LiveDetectionPanel />

          {/* Camera list */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">Cameras</span>
            </div>
            <div className="space-y-2">
              {cameras.length === 0 ? (
                <p className="text-xs text-slate-500">No cameras configured</p>
              ) : cameras.map((cam) => (
                <div key={cam.id} className="flex items-center justify-between py-1.5 border-b border-slate-700/30 last:border-0">
                  <div>
                    <p className="text-xs text-white font-medium">{cam.name}</p>
                    <p className="text-xs text-slate-500">{cam.location} · {cam.source_type}</p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded font-medium',
                    cam.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                  )}>
                    {cam.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

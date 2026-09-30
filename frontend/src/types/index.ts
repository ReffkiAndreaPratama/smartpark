export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface ParkingSlot {
  id: number
  slot_code: string
  zone: string
  slot_type: string
  status: 'available' | 'occupied' | 'reserved' | 'error'
  is_active: boolean
  polygon: number[][] | null
  floor: string
  vehicle_type: string | null
  vehicle_confidence: number | null
  occupied_at: string | null
  created_at: string
  updated_at: string
}

export interface Camera {
  id: number
  name: string
  location: string | null
  source_type: string
  source_url: string | null
  status: 'online' | 'offline'
  is_active: boolean
  created_at: string
}

export interface Sensor {
  id: number
  sensor_id: string
  slot_id: number | null
  sensor_type: string
  status: 'online' | 'offline' | 'error'
  reading: number | null
  is_occupied: boolean
  last_seen: string
}

export interface Detection {
  id: number
  camera_id: number | null
  slot_id: number | null
  vehicle_type: string
  confidence: number
  bbox: number[] | null
  is_demo: boolean
  timestamp: string
}

export interface ParkingSession {
  id: number
  slot_id: number
  vehicle_id: number | null
  entry_time: string
  exit_time: string | null
  duration_minutes: number | null
  status: 'active' | 'completed'
  fee: number
  slot?: ParkingSlot
}

export interface HistoryEntry {
  id: number
  slot_code: string
  zone: string
  vehicle_type: string
  entry_time: string
  exit_time: string | null
  duration_minutes: number | null
  status: string
  fee: number
}

export interface Notification {
  id: number
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  is_read: boolean
  slot_id: number | null
  sensor_id: string | null
  created_at: string
}

export interface DashboardStats {
  total_slots: number
  available_slots: number
  occupied_slots: number
  reserved_slots: number
  occupancy_rate: number
  vehicle_cars: number
  vehicle_motorcycles: number
  vehicle_trucks: number
  active_sessions: number
  demo_mode: boolean
}

export interface ModelStatus {
  model: string
  version: string
  status: string
  classes: string[]
  fps: number
  avg_confidence: number
  last_loaded: string | null
  is_demo: boolean
}

export interface Reservation {
  id: number
  user_id: number
  slot_id: number
  vehicle_type: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  created_at: string
}

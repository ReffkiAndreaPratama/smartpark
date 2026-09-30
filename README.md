# 🚗 SmartPark AI

> **Park Smarter. Detect Faster.**

**AI-Powered Smart Parking Management System** — Real-time vehicle detection via Computer Vision, IoT sensor simulation, and a full web dashboard.

---

## ✨ Features

- 🎥 **Live Camera Monitoring** — Webcam, image upload, or demo mode
- 🤖 **YOLO Vehicle Detection** — Car, motorcycle, bus, truck detection
- 🅿️ **Parking Slot Detection** — Polygon-based occupancy with IoU algorithm
- 📊 **Real-time Dashboard** — Live stats, interactive parking map, charts
- 📡 **WebSocket Updates** — Push-based real-time slot status changes
- 🌡️ **IoT Sensor Simulation** — Ultrasonic sensor readings per slot
- 📋 **Parking History** — Full session records with search, filter, export
- 📈 **Analytics** — Occupancy trends, peak hours, vehicle breakdown, forecast
- 🔔 **Notifications** — Slot changes, sensor offline, reservations
- 📅 **Reservations** — Book parking slots with time ranges
- 👑 **Admin Panel** — User management, system logs, model status
- 📄 **PDF / CSV Export** — Downloadable parking reports
- 🌙 **Dark / Light Mode** — Persistent theme preference
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- 🎭 **Demo Mode** — Fully functional without a real camera or YOLO model

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## 🔑 Default Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@smartpark.ai     | admin123  |
| User  | user@smartpark.ai      | user123   |

---

## 🏗️ Architecture

```
CAMERA / VIDEO
       ↓
COMPUTER VISION (YOLO / Demo)
       ↓
VEHICLE DETECTION
       ↓
PARKING SLOT DETECTION (IoU)
       ↓
FastAPI Backend (Python)
       ↓
SQLite Database
       ↓
WebSocket / REST API
       ↓
React Dashboard (TypeScript)
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite:///./smartpark.db
JWT_SECRET=change-this-secret
DEMO_MODE=true
YOLO_MODEL_PATH=models/yolo.pt
CAMERA_SOURCE=0
FRAME_SKIP=2
OCCUPANCY_THRESHOLD=0.35
MAX_UPLOAD_SIZE_MB=100
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 🤖 Enabling Real YOLO Detection

1. Download a YOLO model (e.g., YOLOv8n):
   ```bash
   pip install ultralytics
   yolo export model=yolov8n.pt format=torchscript
   ```
2. Place the `.pt` file at `backend/models/yolo.pt`
3. Set `DEMO_MODE=false` in `backend/.env`
4. Restart the backend

The system automatically falls back to demo mode if the model is not found.

---

## 📷 Camera Sources

| Source  | Config                         |
|---------|-------------------------------|
| Webcam  | Click "Start Camera" in UI    |
| Image   | Upload .jpg/.png              |
| RTSP    | Set `source_url` in camera settings |
| Demo    | Default — no hardware needed  |

---

## 🗃️ Database

SQLite is used for development. Tables:
`users`, `parking_slots`, `vehicles`, `parking_sessions`, `detections`, `cameras`, `sensors`, `reservations`, `occupancy_snapshots`, `notifications`, `system_logs`

---

## 🔌 API

Interactive docs at: http://localhost:8000/docs

Key endpoints:
```
POST /api/auth/login
POST /api/auth/register
GET  /api/dashboard
GET  /api/parking-slots
POST /api/detection/image
GET  /api/analytics
GET  /api/history
GET  /api/sensors
WS   /ws/parking
```

---

## 📁 Project Structure

```
smartpark-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── cv/           # Computer vision & simulation
│   │   ├── database/     # SQLAlchemy setup
│   │   ├── models/       # ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Auth, deps
│   │   └── main.py       # FastAPI app
│   ├── models/           # YOLO model files
│   ├── scripts/          # Seed script
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   # Reusable UI
│       ├── pages/        # Route pages
│       ├── layouts/      # AppLayout
│       ├── hooks/        # useWebSocket, usePolling
│       ├── services/     # API client
│       ├── store/        # Zustand stores
│       └── types/        # TypeScript types
├── start-backend.bat
├── start-frontend.bat
└── README.md
```

---

## ⚠️ Limitations

- DEMO MODE is active by default — detections are simulated
- RTSP stream connection requires network access to IP cameras
- Parking slot polygons require manual coordinate setup for real cameras
- Prediction model requires sufficient historical data (10+ snapshots)

---

## 🔒 Security Notes

- JWT tokens expire after 24 hours (configurable)
- Passwords hashed with bcrypt
- File uploads validated by extension and size
- CORS restricted to configured origins
- No secrets in source — use `.env`

---

*SmartPark AI — AI-Powered Smart Parking Management System*

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ─── AUTH ───────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── PARKING SLOT ────────────────────────────────────────────────────────────
class ParkingSlotCreate(BaseModel):
    slot_code: str
    zone: str
    slot_type: Optional[str] = "car"
    floor: Optional[str] = "G"
    polygon: Optional[List[List[float]]] = None


class ParkingSlotUpdate(BaseModel):
    slot_code: Optional[str] = None
    zone: Optional[str] = None
    slot_type: Optional[str] = None
    status: Optional[str] = None
    floor: Optional[str] = None
    is_active: Optional[bool] = None
    polygon: Optional[List[List[float]]] = None


class ParkingSlotOut(BaseModel):
    id: int
    slot_code: str
    zone: str
    slot_type: str
    status: str
    is_active: bool
    polygon: Optional[Any] = None
    floor: str
    vehicle_type: Optional[str] = None
    vehicle_confidence: Optional[float] = None
    occupied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── CAMERA ──────────────────────────────────────────────────────────────────
class CameraCreate(BaseModel):
    name: str
    location: Optional[str] = None
    source_type: Optional[str] = "demo"
    source_url: Optional[str] = None


class CameraOut(BaseModel):
    id: int
    name: str
    location: Optional[str]
    source_type: str
    source_url: Optional[str]
    status: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── SENSOR ──────────────────────────────────────────────────────────────────
class SensorOut(BaseModel):
    id: int
    sensor_id: str
    slot_id: Optional[int]
    sensor_type: str
    status: str
    reading: Optional[float]
    is_occupied: bool
    last_seen: datetime

    class Config:
        from_attributes = True


# ─── DETECTION ───────────────────────────────────────────────────────────────
class DetectionCreate(BaseModel):
    camera_id: Optional[int] = None
    slot_id: Optional[int] = None
    vehicle_type: str
    confidence: float
    bbox: Optional[List[float]] = None
    is_demo: Optional[bool] = False


class DetectionOut(BaseModel):
    id: int
    camera_id: Optional[int]
    slot_id: Optional[int]
    vehicle_type: str
    confidence: float
    bbox: Optional[Any]
    is_demo: bool
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── SESSION ─────────────────────────────────────────────────────────────────
class ParkingSessionOut(BaseModel):
    id: int
    slot_id: int
    vehicle_id: Optional[int]
    entry_time: datetime
    exit_time: Optional[datetime]
    duration_minutes: Optional[float]
    status: str
    fee: float
    slot: Optional[ParkingSlotOut] = None

    class Config:
        from_attributes = True


# ─── RESERVATION ─────────────────────────────────────────────────────────────
class ReservationCreate(BaseModel):
    slot_id: int
    vehicle_type: Optional[str] = "car"
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None


class ReservationOut(BaseModel):
    id: int
    user_id: int
    slot_id: int
    vehicle_type: str
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── NOTIFICATION ─────────────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    slot_id: Optional[int]
    sensor_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── DASHBOARD ───────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    occupancy_rate: float
    vehicle_cars: int
    vehicle_motorcycles: int
    vehicle_trucks: int
    active_sessions: int
    demo_mode: bool


# ─── ANALYTICS ───────────────────────────────────────────────────────────────
class OccupancyPoint(BaseModel):
    hour: str
    occupancy_rate: float
    occupied: int
    available: int


class AnalyticsOut(BaseModel):
    occupancy_trend: List[OccupancyPoint]
    vehicle_breakdown: dict
    peak_hours: List[dict]
    daily_stats: dict
    total_sessions: int
    avg_duration_minutes: float
    parking_efficiency: Optional[float]


# ─── MODEL STATUS ─────────────────────────────────────────────────────────────
class ModelStatusOut(BaseModel):
    model: str
    version: str
    status: str
    classes: List[str]
    fps: float
    avg_confidence: float
    last_loaded: Optional[str]
    is_demo: bool

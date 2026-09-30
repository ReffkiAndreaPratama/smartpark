from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models.models import ParkingSlot, ParkingSession, Detection
from app.schemas.schemas import DashboardStats
from app.cv.simulation import get_demo_detections
import os

router = APIRouter(prefix="/api", tags=["dashboard"])
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).all()
    total = len(slots)
    available = sum(1 for s in slots if s.status == "available")
    occupied = sum(1 for s in slots if s.status == "occupied")
    reserved = sum(1 for s in slots if s.status == "reserved")
    occupancy_rate = round((occupied / total * 100) if total > 0 else 0, 1)

    cars = sum(1 for s in slots if s.status == "occupied" and s.vehicle_type == "car")
    motorcycles = sum(1 for s in slots if s.status == "occupied" and s.vehicle_type == "motorcycle")
    trucks = sum(1 for s in slots if s.status == "occupied" and s.vehicle_type == "truck")

    active_sessions = db.query(ParkingSession).filter(ParkingSession.status == "active").count()

    return DashboardStats(
        total_slots=total,
        available_slots=available,
        occupied_slots=occupied,
        reserved_slots=reserved,
        occupancy_rate=occupancy_rate,
        vehicle_cars=cars,
        vehicle_motorcycles=motorcycles,
        vehicle_trucks=trucks,
        active_sessions=active_sessions,
        demo_mode=DEMO_MODE,
    )

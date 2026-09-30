from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User, ParkingSlot, Camera, Sensor, ParkingSession, SystemLog, Detection
from app.services.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/overview")
def admin_overview(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    return {
        "users": db.query(User).count(),
        "parking_slots": db.query(ParkingSlot).count(),
        "cameras": db.query(Camera).count(),
        "sensors": db.query(Sensor).count(),
        "total_sessions": db.query(ParkingSession).count(),
        "active_sessions": db.query(ParkingSession).filter(ParkingSession.status == "active").count(),
        "total_detections": db.query(Detection).count(),
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    users = db.query(User).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "is_active": u.is_active, "created_at": u.created_at}
        for u in users
    ]


@router.get("/logs")
def system_logs(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return [
        {"id": l.id, "action": l.action, "description": l.description, "timestamp": l.timestamp}
        for l in logs
    ]

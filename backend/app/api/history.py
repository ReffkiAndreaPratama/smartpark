from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, date
from app.database.database import get_db
from app.models.models import ParkingSession, ParkingSlot, Vehicle
import csv
import io
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def get_history(
    search: Optional[str] = Query(None),
    slot_code: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = (
        db.query(ParkingSession)
        .options(joinedload(ParkingSession.slot), joinedload(ParkingSession.vehicle))
        .order_by(ParkingSession.entry_time.desc())
    )

    if slot_code:
        q = q.join(ParkingSlot).filter(ParkingSlot.slot_code.ilike(f"%{slot_code}%"))

    if vehicle_type:
        q = q.join(Vehicle, isouter=True).filter(Vehicle.vehicle_type == vehicle_type)

    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            q = q.filter(ParkingSession.entry_time >= dt)
        except ValueError:
            pass

    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            q = q.filter(ParkingSession.entry_time <= dt)
        except ValueError:
            pass

    total = q.count()
    sessions = q.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "data": [
            {
                "id": s.id,
                "slot_code": s.slot.slot_code if s.slot else "—",
                "zone": s.slot.zone if s.slot else "—",
                "vehicle_type": s.vehicle.vehicle_type if s.vehicle else "unknown",
                "entry_time": s.entry_time.isoformat() if s.entry_time else None,
                "exit_time": s.exit_time.isoformat() if s.exit_time else None,
                "duration_minutes": s.duration_minutes,
                "status": s.status,
                "fee": s.fee,
            }
            for s in sessions
        ],
    }


@router.get("/export/csv")
def export_history_csv(db: Session = Depends(get_db)):
    sessions = (
        db.query(ParkingSession)
        .options(joinedload(ParkingSession.slot), joinedload(ParkingSession.vehicle))
        .order_by(ParkingSession.entry_time.desc())
        .limit(10000)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Slot", "Zone", "Vehicle Type", "Entry Time", "Exit Time", "Duration (min)", "Status", "Fee"])
    for s in sessions:
        writer.writerow([
            s.id,
            s.slot.slot_code if s.slot else "",
            s.slot.zone if s.slot else "",
            s.vehicle.vehicle_type if s.vehicle else "unknown",
            s.entry_time.isoformat() if s.entry_time else "",
            s.exit_time.isoformat() if s.exit_time else "",
            s.duration_minutes or "",
            s.status,
            s.fee,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=parking_history.csv"},
    )

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import ParkingSession, ParkingSlot, Vehicle
from app.schemas.schemas import ParkingSessionOut

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=List[ParkingSessionOut])
def list_sessions(
    status: Optional[str] = Query(None),
    slot_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = db.query(ParkingSession).options(joinedload(ParkingSession.slot))
    if status:
        q = q.filter(ParkingSession.status == status)
    if slot_id:
        q = q.filter(ParkingSession.slot_id == slot_id)
    return q.order_by(ParkingSession.entry_time.desc()).offset(offset).limit(limit).all()


@router.get("/{session_id}", response_model=ParkingSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ParkingSession).options(
        joinedload(ParkingSession.slot)
    ).filter(ParkingSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session

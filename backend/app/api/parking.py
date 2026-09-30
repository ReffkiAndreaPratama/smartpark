from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.models import ParkingSlot, ParkingSession, Vehicle, Notification
from app.schemas.schemas import ParkingSlotCreate, ParkingSlotUpdate, ParkingSlotOut
from app.services.deps import get_current_user, get_current_admin
from app.models.models import User
from datetime import datetime

router = APIRouter(prefix="/api/parking-slots", tags=["parking"])


@router.get("", response_model=List[ParkingSlotOut])
def list_slots(
    zone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    slot_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ParkingSlot)
    if zone:
        q = q.filter(ParkingSlot.zone == zone)
    if status:
        q = q.filter(ParkingSlot.status == status)
    if slot_type:
        q = q.filter(ParkingSlot.slot_type == slot_type)
    return q.order_by(ParkingSlot.slot_code).all()


@router.get("/{slot_id}", response_model=ParkingSlotOut)
def get_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    return slot


@router.post("", response_model=ParkingSlotOut, status_code=201)
def create_slot(
    data: ParkingSlotCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    existing = db.query(ParkingSlot).filter(ParkingSlot.slot_code == data.slot_code).first()
    if existing:
        raise HTTPException(409, "Slot code already exists")
    slot = ParkingSlot(**data.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/{slot_id}", response_model=ParkingSlotOut)
def update_slot(
    slot_id: int,
    data: ParkingSlotUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(slot, k, v)
    slot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=204)
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    db.delete(slot)
    db.commit()


@router.post("/{slot_id}/occupy")
def manually_occupy(
    slot_id: int,
    vehicle_type: str = "car",
    db: Session = Depends(get_db),
):
    """Manually mark a slot as occupied (demo/testing)."""
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    if slot.status == "occupied":
        # Release it
        slot.status = "available"
        slot.vehicle_type = None
        slot.vehicle_confidence = None
        slot.occupied_at = None
        # Close active session
        session = db.query(ParkingSession).filter(
            ParkingSession.slot_id == slot_id, ParkingSession.status == "active"
        ).first()
        if session:
            session.exit_time = datetime.utcnow()
            session.status = "completed"
            if session.entry_time:
                delta = (datetime.utcnow() - session.entry_time).total_seconds() / 60
                session.duration_minutes = round(delta, 1)
        notif = Notification(
            type="info",
            title=f"Slot {slot.slot_code} Available",
            message=f"Parking slot {slot.slot_code} is now available.",
            slot_id=slot_id,
        )
        db.add(notif)
    else:
        slot.status = "occupied"
        slot.vehicle_type = vehicle_type
        slot.vehicle_confidence = 0.95
        slot.occupied_at = datetime.utcnow()
        vehicle = Vehicle(vehicle_type=vehicle_type)
        db.add(vehicle)
        db.flush()
        session = ParkingSession(slot_id=slot_id, vehicle_id=vehicle.id, entry_time=datetime.utcnow())
        db.add(session)
        notif = Notification(
            type="info",
            title=f"Slot {slot.slot_code} Occupied",
            message=f"A {vehicle_type} entered slot {slot.slot_code}.",
            slot_id=slot_id,
        )
        db.add(notif)
    db.commit()
    db.refresh(slot)
    return {"slot_code": slot.slot_code, "status": slot.status}

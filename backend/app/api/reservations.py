from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.database import get_db
from app.models.models import Reservation, ParkingSlot, Notification
from app.schemas.schemas import ReservationCreate, ReservationOut
from app.services.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.post("", response_model=ReservationOut, status_code=201)
def create_reservation(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == data.slot_id).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    if slot.status == "occupied":
        raise HTTPException(409, "Slot is currently occupied")

    # Check time overlap
    overlap = (
        db.query(Reservation)
        .filter(
            Reservation.slot_id == data.slot_id,
            Reservation.status.in_(["pending", "active"]),
            Reservation.start_time < data.end_time,
            Reservation.end_time > data.start_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(409, "Slot already reserved for this time period")

    res = Reservation(user_id=user.id, **data.model_dump())
    db.add(res)

    # Update slot status
    slot.status = "reserved"

    notif = Notification(
        type="info",
        title=f"Slot {slot.slot_code} Reserved",
        message=f"Slot {slot.slot_code} has been reserved by {user.name}.",
        slot_id=slot.id,
    )
    db.add(notif)
    db.commit()
    db.refresh(res)
    return res


@router.get("", response_model=List[ReservationOut])
def list_reservations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Reservation)
    if user.role != "admin":
        q = q.filter(Reservation.user_id == user.id)
    return q.order_by(Reservation.start_time.desc()).all()


@router.delete("/{reservation_id}", status_code=204)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(404, "Reservation not found")
    if res.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not authorized")
    res.status = "cancelled"
    # Free the slot if no other active reservations
    other = (
        db.query(Reservation)
        .filter(
            Reservation.slot_id == res.slot_id,
            Reservation.status.in_(["pending", "active"]),
            Reservation.id != res.id,
        )
        .first()
    )
    if not other:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == res.slot_id).first()
        if slot and slot.status == "reserved":
            slot.status = "available"
    db.commit()

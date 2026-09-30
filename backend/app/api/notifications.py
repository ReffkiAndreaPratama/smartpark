from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Notification
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(30, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Notification).order_by(Notification.created_at.desc())
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.limit(limit).all()


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"ok": True}

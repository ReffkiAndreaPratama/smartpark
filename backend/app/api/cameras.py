from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Camera
from app.schemas.schemas import CameraCreate, CameraOut
from app.services.deps import get_current_admin
from app.models.models import User

router = APIRouter(prefix="/api/cameras", tags=["cameras"])


@router.get("", response_model=List[CameraOut])
def list_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()


@router.post("", response_model=CameraOut, status_code=201)
def create_camera(
    data: CameraCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    cam = Camera(**data.model_dump())
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return cam


@router.put("/{camera_id}/status")
def update_camera_status(
    camera_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(404, "Camera not found")
    if status not in ("online", "offline"):
        raise HTTPException(400, "Status must be online or offline")
    cam.status = status
    db.commit()
    return {"id": camera_id, "status": status}


@router.delete("/{camera_id}", status_code=204)
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(404, "Camera not found")
    db.delete(cam)
    db.commit()

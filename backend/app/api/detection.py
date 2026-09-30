import io
import os
import numpy as np
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from PIL import Image

from app.database.database import get_db
from app.models.models import Detection, ParkingSlot, Notification
from app.schemas.schemas import DetectionCreate, DetectionOut
from app.cv.detector import detect_vehicles_from_array, get_model_status
from app.cv.parking_detector import batch_check_slots
from app.cv.simulation import get_demo_detections

router = APIRouter(prefix="/api", tags=["detection"])
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".mp4", ".avi", ".mov"}


@router.post("/detection/image")
async def detect_from_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(400, "Unsupported image format. Use jpg, jpeg, or png.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds the {MAX_UPLOAD_MB}MB limit.")

    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img_array = np.array(img)

    detections = detect_vehicles_from_array(img_array)

    # Check against parking slots
    slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).all()
    slot_dicts = [
        {"id": s.id, "slot_code": s.slot_code, "polygon": s.polygon}
        for s in slots
    ]
    slot_results = batch_check_slots(slot_dicts, detections)

    # Persist detections
    for det in detections:
        d = Detection(
            vehicle_type=det["vehicle_type"],
            confidence=det["confidence"],
            bbox=det.get("bbox"),
            is_demo=det.get("is_demo", False),
        )
        db.add(d)
    db.commit()

    return {
        "detections": detections,
        "slot_results": slot_results,
        "model_status": get_model_status(),
        "is_demo": DEMO_MODE,
    }


@router.post("/detection", response_model=DetectionOut, status_code=201)
def create_detection(data: DetectionCreate, db: Session = Depends(get_db)):
    det = Detection(**data.model_dump())
    db.add(det)
    db.commit()
    db.refresh(det)
    return det


@router.get("/detections", response_model=List[DetectionOut])
def list_detections(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    return (
        db.query(Detection)
        .order_by(Detection.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/model/status")
def model_status():
    return get_model_status()


@router.get("/detection/demo")
def get_demo_detection_snapshot(db: Session = Depends(get_db)):
    """Return current demo detection state."""
    return {"detections": get_demo_detections(), "is_demo": True}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.models import Sensor, ParkingSlot
from app.schemas.schemas import SensorOut
from app.cv.simulation import get_demo_sensors
import os

router = APIRouter(prefix="/api/sensors", tags=["sensors"])
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


@router.get("", response_model=List[SensorOut])
def list_sensors(db: Session = Depends(get_db)):
    if DEMO_MODE:
        # Return live demo sensor data merged with DB sensors
        demo = get_demo_sensors()
        sensors = db.query(Sensor).all()
        # Overlay demo readings onto DB sensors
        sensor_map = {s.sensor_id: s for s in sensors}
        results = []
        for d in demo:
            sid = d["sensor_id"]
            if sid in sensor_map:
                s = sensor_map[sid]
                s.status = d["status"]
                s.reading = d["reading"]
                s.is_occupied = d["is_occupied"]
                results.append(s)
            else:
                # Return raw demo dict shaped as SensorOut
                results.append(SensorOut(
                    id=0,
                    sensor_id=sid,
                    slot_id=None,
                    sensor_type=d["sensor_type"],
                    status=d["status"],
                    reading=d["reading"],
                    is_occupied=d["is_occupied"],
                    last_seen=d["last_seen"],
                ))
        return results
    return db.query(Sensor).all()


@router.get("/{sensor_id}", response_model=SensorOut)
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(404, "Sensor not found")
    return sensor


@router.post("/{sensor_id}/retry")
def retry_sensor(sensor_id: str, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if sensor:
        sensor.status = "online"
        db.commit()
    return {"sensor_id": sensor_id, "status": "online"}

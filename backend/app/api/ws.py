"""
WebSocket endpoint for real-time parking updates.
Broadcasts slot status changes every 2 seconds.
"""
import asyncio
import json
import os
from datetime import datetime
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.cv.simulation import tick_simulation, get_all_slot_states

router = APIRouter()
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

_connections: Set[WebSocket] = set()


async def broadcast(message: dict):
    dead = set()
    for ws in _connections:
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.add(ws)
    _connections.difference_update(dead)


@router.websocket("/ws/parking")
async def parking_ws(websocket: WebSocket):
    await websocket.accept()
    _connections.add(websocket)
    # Send initial state
    states = get_all_slot_states()
    await websocket.send_text(json.dumps({
        "type": "init",
        "data": states,
        "timestamp": datetime.utcnow().isoformat(),
        "is_demo": DEMO_MODE,
    }))
    try:
        while True:
            # Keep connection alive; actual updates come from simulation_loop
            data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except (WebSocketDisconnect, asyncio.TimeoutError):
        _connections.discard(websocket)
    except Exception:
        _connections.discard(websocket)


async def simulation_loop(app):
    """Background task that ticks the demo simulation and broadcasts changes."""
    from app.database.database import SessionLocal
    from app.models.models import ParkingSlot, ParkingSession, Vehicle, OccupancySnapshot, Notification
    from app.cv.simulation import init_slots, tick_simulation, get_all_slot_states

    await asyncio.sleep(2)  # let app start

    while True:
        try:
            db = SessionLocal()
            slots = db.query(ParkingSlot).filter(ParkingSlot.is_active == True).all()
            slot_codes = [s.slot_code for s in slots]

            if slot_codes:
                init_slots(slot_codes)
                if DEMO_MODE:
                    changed = tick_simulation(slot_codes)
                    states = get_all_slot_states()

                    for change in changed:
                        code = change["slot_code"]
                        db_slot = next((s for s in slots if s.slot_code == code), None)
                        if not db_slot:
                            continue

                        prev_status = db_slot.status
                        new_status = change["status"]

                        if new_status == "occupied" and prev_status != "occupied":
                            db_slot.status = "occupied"
                            db_slot.vehicle_type = change.get("vehicle_type")
                            db_slot.vehicle_confidence = change.get("confidence")
                            db_slot.occupied_at = datetime.utcnow()
                            v = Vehicle(vehicle_type=change.get("vehicle_type", "car"))
                            db.add(v)
                            db.flush()
                            sess = ParkingSession(slot_id=db_slot.id, vehicle_id=v.id, entry_time=datetime.utcnow())
                            db.add(sess)
                            notif = Notification(
                                type="info",
                                title=f"Slot {code} Occupied",
                                message=f"A {change.get('vehicle_type', 'vehicle')} entered {code}.",
                                slot_id=db_slot.id,
                            )
                            db.add(notif)

                        elif new_status == "available" and prev_status == "occupied":
                            db_slot.status = "available"
                            db_slot.vehicle_type = None
                            db_slot.vehicle_confidence = None
                            db_slot.occupied_at = None
                            active_sess = db.query(ParkingSession).filter(
                                ParkingSession.slot_id == db_slot.id,
                                ParkingSession.status == "active"
                            ).first()
                            if active_sess:
                                active_sess.exit_time = datetime.utcnow()
                                active_sess.status = "completed"
                                if active_sess.entry_time:
                                    delta = (datetime.utcnow() - active_sess.entry_time).total_seconds() / 60
                                    active_sess.duration_minutes = round(delta, 1)
                            notif = Notification(
                                type="success",
                                title=f"Slot {code} Available",
                                message=f"Slot {code} is now available.",
                                slot_id=db_slot.id,
                            )
                            db.add(notif)

                    if changed:
                        db.commit()

                    # Take occupancy snapshot every ~10 ticks (handled by counter externally)
                    total = len(slots)
                    occupied = sum(1 for s in states.values() if s.get("status") == "occupied")
                    snap = OccupancySnapshot(
                        total_slots=total,
                        occupied_slots=occupied,
                        available_slots=total - occupied,
                        occupancy_rate=round(occupied / total * 100, 1) if total > 0 else 0,
                    )
                    db.add(snap)
                    db.commit()

                    # Broadcast to all connected WS clients
                    if changed or _connections:
                        await broadcast({
                            "type": "update",
                            "changed": changed,
                            "states": states,
                            "timestamp": datetime.utcnow().isoformat(),
                            "is_demo": True,
                        })

        except Exception as e:
            print(f"[SimLoop] Error: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass

        await asyncio.sleep(3)

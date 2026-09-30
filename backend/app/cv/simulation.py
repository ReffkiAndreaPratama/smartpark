"""
Demo simulation engine — drives realistic parking slot status changes
without a real camera or YOLO model.
"""
import asyncio
import random
import time
import os
from datetime import datetime
from typing import Dict, Any, List

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

# Slot state: {slot_code: {"status": "available"|"occupied", "vehicle_type": ..., "confidence": ..., "since": ts}}
_slot_states: Dict[str, Dict[str, Any]] = {}
_simulation_running = False

VEHICLE_TYPES = ["car", "car", "car", "motorcycle", "car", "motorcycle"]
CHANGE_PROBABILITY = 0.08  # per slot per tick — ~8% chance of state change
TICK_INTERVAL = 3  # seconds


def init_slots(slot_codes: List[str], initial_occupied_rate: float = 0.70):
    """Initialize demo states for all slots."""
    for code in slot_codes:
        if code not in _slot_states:
            occupied = random.random() < initial_occupied_rate
            _slot_states[code] = {
                "status": "occupied" if occupied else "available",
                "vehicle_type": random.choice(VEHICLE_TYPES) if occupied else None,
                "confidence": round(random.uniform(0.85, 0.97), 4) if occupied else None,
                "since": datetime.now().isoformat(),
                "is_demo": True,
            }


def get_all_slot_states() -> Dict[str, Dict[str, Any]]:
    return _slot_states.copy()


def get_slot_state(slot_code: str) -> Dict[str, Any]:
    return _slot_states.get(slot_code, {})


def tick_simulation(slot_codes: List[str]) -> List[Dict[str, Any]]:
    """Advance simulation one tick — returns list of changed slots."""
    changed = []
    for code in slot_codes:
        if random.random() < CHANGE_PROBABILITY:
            current = _slot_states.get(code, {})
            if current.get("status") == "occupied":
                _slot_states[code] = {
                    "status": "available",
                    "vehicle_type": None,
                    "confidence": None,
                    "since": datetime.now().isoformat(),
                    "is_demo": True,
                }
            else:
                vtype = random.choice(VEHICLE_TYPES)
                _slot_states[code] = {
                    "status": "occupied",
                    "vehicle_type": vtype,
                    "confidence": round(random.uniform(0.85, 0.97), 4),
                    "since": datetime.now().isoformat(),
                    "is_demo": True,
                }
            changed.append({"slot_code": code, **_slot_states[code]})
    return changed


def get_demo_detections() -> List[Dict[str, Any]]:
    """Return a snapshot of currently occupied slots as detection events."""
    detections = []
    for code, state in _slot_states.items():
        if state.get("status") == "occupied":
            detections.append({
                "slot_code": code,
                "vehicle_type": state.get("vehicle_type", "car"),
                "confidence": state.get("confidence", 0.9),
                "is_demo": True,
            })
    return detections


def get_demo_sensors() -> List[Dict[str, Any]]:
    """Generate demo sensor readings."""
    sensors = []
    for code, state in _slot_states.items():
        distance = round(random.uniform(0.2, 0.6), 2) if state.get("status") == "occupied" else round(random.uniform(1.8, 2.5), 2)
        sensors.append({
            "sensor_id": f"US-{code}",
            "slot_code": code,
            "sensor_type": "ultrasonic",
            "status": "online" if random.random() > 0.03 else "offline",
            "reading": distance,
            "is_occupied": state.get("status") == "occupied",
            "last_seen": datetime.now().isoformat(),
        })
    return sensors

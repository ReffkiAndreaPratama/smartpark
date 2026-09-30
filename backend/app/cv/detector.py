"""
Vehicle detector — uses YOLO if available, falls back to demo simulation.
"""
import os
import time
import random
import numpy as np
from typing import List, Dict, Any, Optional

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "models/yolo.pt")
TARGET_CLASSES = {"car", "motorcycle", "bus", "truck"}

_model = None
_model_loaded = False
_model_load_time: Optional[str] = None
_model_fps: float = 0.0
_model_confidence: float = 0.0
_is_demo = True


def _try_load_yolo():
    global _model, _model_loaded, _model_load_time, _is_demo
    try:
        from ultralytics import YOLO  # type: ignore
        if os.path.exists(YOLO_MODEL_PATH):
            _model = YOLO(YOLO_MODEL_PATH)
            _model_loaded = True
            _model_load_time = time.strftime("%Y-%m-%d %H:%M:%S")
            _is_demo = False
            print(f"[CV] YOLO model loaded from {YOLO_MODEL_PATH}")
        else:
            print(f"[CV] YOLO model not found at {YOLO_MODEL_PATH}. Using demo mode.")
    except ImportError:
        print("[CV] ultralytics not installed. Using demo mode.")
    except Exception as e:
        print(f"[CV] Failed to load YOLO: {e}. Using demo mode.")


_try_load_yolo()


def get_model_status() -> Dict[str, Any]:
    return {
        "model": "YOLO",
        "version": "YOLO11" if _model_loaded else "Demo",
        "status": "loaded" if _model_loaded else "demo",
        "classes": list(TARGET_CLASSES),
        "fps": round(_model_fps, 1) if _model_loaded else round(random.uniform(22, 26), 1),
        "avg_confidence": round(_model_confidence, 3) if _model_loaded else round(random.uniform(0.88, 0.96), 3),
        "last_loaded": _model_load_time,
        "is_demo": _is_demo,
    }


def detect_vehicles_from_array(image: np.ndarray) -> List[Dict[str, Any]]:
    """Run vehicle detection on a numpy image array."""
    if _model_loaded and _model is not None:
        return _run_yolo(image)
    return _run_demo_detection(image)


def _run_yolo(image: np.ndarray) -> List[Dict[str, Any]]:
    global _model_fps, _model_confidence
    t0 = time.time()
    results = _model(image, verbose=False)[0]
    elapsed = time.time() - t0
    _model_fps = 1.0 / elapsed if elapsed > 0 else 0.0

    detections = []
    confidences = []
    for box in results.boxes:
        cls_name = results.names[int(box.cls[0])].lower()
        if cls_name not in TARGET_CLASSES:
            continue
        conf = float(box.conf[0])
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
        detections.append({
            "vehicle_type": cls_name,
            "confidence": round(conf, 4),
            "bbox": [round(x1), round(y1), round(x2), round(y2)],
            "is_demo": False,
        })
        confidences.append(conf)

    if confidences:
        _model_confidence = sum(confidences) / len(confidences)
    return detections


def _run_demo_detection(image: np.ndarray) -> List[Dict[str, Any]]:
    """Simulate realistic vehicle detections for demo purposes."""
    h, w = image.shape[:2] if len(image.shape) >= 2 else (480, 640)
    count = random.randint(2, 6)
    types = ["car", "car", "car", "motorcycle", "car", "motorcycle", "truck"]
    detections = []
    for i in range(count):
        vtype = random.choice(types)
        x1 = random.randint(50, w - 200)
        y1 = random.randint(50, h - 150)
        bw = random.randint(100, 200) if vtype == "car" else random.randint(60, 120)
        bh = random.randint(80, 150) if vtype == "car" else random.randint(50, 100)
        detections.append({
            "vehicle_type": vtype,
            "confidence": round(random.uniform(0.82, 0.97), 4),
            "bbox": [x1, y1, min(x1 + bw, w), min(y1 + bh, h)],
            "is_demo": True,
        })
    return detections

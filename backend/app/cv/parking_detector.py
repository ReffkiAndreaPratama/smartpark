"""
Parking slot occupancy detection via bounding-box / polygon intersection.
"""
from typing import List, Dict, Any, Optional
import os

OCCUPANCY_THRESHOLD = float(os.getenv("OCCUPANCY_THRESHOLD", "0.35"))

# Rolling status buffer per slot to debounce flickering
_status_buffer: Dict[str, List[bool]] = {}
STABILITY_FRAMES = 5


def compute_iou_bbox_polygon(bbox: List[float], polygon: List[List[float]]) -> float:
    """Approximate IoU using bounding rect of polygon vs vehicle bbox."""
    if not polygon or len(polygon) < 3:
        return 0.0

    px_vals = [p[0] for p in polygon]
    py_vals = [p[1] for p in polygon]
    px1, py1, px2, py2 = min(px_vals), min(py_vals), max(px_vals), max(py_vals)

    bx1, by1, bx2, by2 = bbox[0], bbox[1], bbox[2], bbox[3]

    inter_x1 = max(px1, bx1)
    inter_y1 = max(py1, by1)
    inter_x2 = min(px2, bx2)
    inter_y2 = min(py2, by2)

    if inter_x2 < inter_x1 or inter_y2 < inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    slot_area = (px2 - px1) * (py2 - py1)

    if slot_area == 0:
        return 0.0

    return inter_area / slot_area


def determine_slot_occupancy(
    slot_id: str,
    polygon: Optional[List[List[float]]],
    detections: List[Dict[str, Any]],
    threshold: float = OCCUPANCY_THRESHOLD,
) -> Dict[str, Any]:
    """
    Returns occupancy decision for a single slot given current detections.
    Applies temporal smoothing to avoid status flickering.
    """
    if not polygon:
        return {"occupied": False, "confidence": 0.0, "vehicle_type": None, "overlap": 0.0}

    best_overlap = 0.0
    best_detection = None

    for det in detections:
        bbox = det.get("bbox")
        if not bbox or len(bbox) < 4:
            continue
        overlap = compute_iou_bbox_polygon(bbox, polygon)
        if overlap > best_overlap:
            best_overlap = overlap
            best_detection = det

    currently_occupied = best_overlap >= threshold

    # Temporal smoothing
    buf = _status_buffer.setdefault(slot_id, [])
    buf.append(currently_occupied)
    if len(buf) > STABILITY_FRAMES:
        buf.pop(0)

    # Majority vote
    stable_occupied = sum(buf) > len(buf) / 2

    return {
        "occupied": stable_occupied,
        "confidence": round(best_detection["confidence"], 4) if best_detection else 0.0,
        "vehicle_type": best_detection["vehicle_type"] if best_detection else None,
        "overlap": round(best_overlap, 4),
    }


def batch_check_slots(
    slots: List[Dict[str, Any]],
    detections: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Process all slots against the current detection list."""
    results = []
    for slot in slots:
        occupancy = determine_slot_occupancy(
            slot_id=str(slot.get("slot_code", slot.get("id"))),
            polygon=slot.get("polygon"),
            detections=detections,
        )
        results.append({**slot, **occupancy})
    return results

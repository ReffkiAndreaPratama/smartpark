"""
Seed the database with demo data on first run.
"""
import random
from datetime import datetime, timedelta


def seed_database():
    from app.database.database import SessionLocal
    from app.models.models import (
        User, ParkingSlot, Camera, Sensor, Vehicle,
        ParkingSession, OccupancySnapshot, Notification
    )
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(ParkingSlot).count() > 0:
            return

        print("[Seed] Seeding database with demo data...")

        # ── Admin user ──────────────────────────────────────────
        # Use truncated passwords to avoid bcrypt 72-byte issue
        admin_pw = "admin123"[:72]
        user_pw = "user123"[:72]
        admin = User(
            name="Admin SmartPark",
            email="admin@smartpark.ai",
            password_hash=hash_password(admin_pw),
            role="admin",
        )
        demo_user = User(
            name="Demo User",
            email="user@smartpark.ai",
            password_hash=hash_password(user_pw),
            role="user",
        )
        db.add_all([admin, demo_user])
        db.flush()

        # ── Parking slots ────────────────────────────────────────
        zones = {
            "A": (10, "car"),
            "B": (10, "car"),
            "C": (10, "car"),
            "D": (10, "motorcycle"),
        }
        slots = []
        occupied_rate = 0.70
        vtype_choices = ["car", "car", "car", "motorcycle", "car", "motorcycle"]

        slot_x, slot_y = 50, 50
        slot_w, slot_h = 80, 60
        col_gap, row_gap = 20, 20

        for zone, (count, default_type) in zones.items():
            for i in range(1, count + 1):
                code = f"{zone}{i:02d}"
                col = (i - 1) % 5
                row = (i - 1) // 5
                x1 = slot_x + col * (slot_w + col_gap)
                y1 = slot_y + row * (slot_h + row_gap)
                polygon = [
                    [x1, y1], [x1 + slot_w, y1],
                    [x1 + slot_w, y1 + slot_h], [x1, y1 + slot_h]
                ]

                occupied = random.random() < occupied_rate
                vtype = random.choice(vtype_choices) if occupied else None
                slot = ParkingSlot(
                    slot_code=code,
                    zone=zone,
                    slot_type=default_type,
                    status="occupied" if occupied else "available",
                    polygon=polygon,
                    vehicle_type=vtype,
                    vehicle_confidence=round(random.uniform(0.85, 0.97), 4) if occupied else None,
                    occupied_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 120)) if occupied else None,
                )
                slots.append(slot)

        # VIP zone
        for i in range(1, 3):
            code = f"VIP{i:02d}"
            occupied = random.random() < 0.3
            slot = ParkingSlot(
                slot_code=code,
                zone="VIP",
                slot_type="vip",
                status="occupied" if occupied else "available",
                vehicle_type="car" if occupied else None,
                vehicle_confidence=round(random.uniform(0.85, 0.97), 4) if occupied else None,
                occupied_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 60)) if occupied else None,
            )
            slots.append(slot)

        db.add_all(slots)
        db.flush()

        # ── Cameras ──────────────────────────────────────────────
        cameras = [
            Camera(name="Camera Zone A", location="Zone A Entrance", source_type="demo", status="online"),
            Camera(name="Camera Zone B", location="Zone B North", source_type="demo", status="online"),
            Camera(name="Camera Zone C", location="Zone C South", source_type="demo", status="offline"),
            Camera(name="Main Entrance", location="Entrance Gate", source_type="demo", status="online"),
        ]
        db.add_all(cameras)
        db.flush()

        # ── Sensors ──────────────────────────────────────────────
        for slot in slots[:20]:
            reading = round(random.uniform(0.2, 0.6), 2) if slot.status == "occupied" else round(random.uniform(1.8, 2.5), 2)
            sensor = Sensor(
                sensor_id=f"US-{slot.slot_code}",
                slot_id=slot.id,
                sensor_type="ultrasonic",
                status="online" if random.random() > 0.05 else "offline",
                reading=reading,
                is_occupied=slot.status == "occupied",
            )
            db.add(sensor)

        # ── Demo vehicles & sessions ─────────────────────────────
        for slot in slots:
            if slot.status == "occupied":
                v = Vehicle(vehicle_type=slot.vehicle_type or "car")
                db.add(v)
                db.flush()
                entry = slot.occupied_at or datetime.utcnow() - timedelta(minutes=30)
                sess = ParkingSession(
                    slot_id=slot.id,
                    vehicle_id=v.id,
                    entry_time=entry,
                    status="active",
                )
                db.add(sess)

        # ── Historical sessions (last 24h) ────────────────────────
        for _ in range(60):
            slot = random.choice(slots)
            entry = datetime.utcnow() - timedelta(hours=random.randint(1, 23), minutes=random.randint(0, 59))
            exit_ = entry + timedelta(minutes=random.randint(15, 180))
            if exit_ > datetime.utcnow():
                exit_ = None
            v = Vehicle(vehicle_type=random.choice(["car", "car", "motorcycle"]))
            db.add(v)
            db.flush()
            sess = ParkingSession(
                slot_id=slot.id,
                vehicle_id=v.id,
                entry_time=entry,
                exit_time=exit_,
                duration_minutes=round((exit_ - entry).total_seconds() / 60, 1) if exit_ else None,
                status="completed" if exit_ else "active",
            )
            db.add(sess)

        # ── Occupancy snapshots ──────────────────────────────────
        total_slots = len(slots)
        for h in range(24):
            for _ in range(2):
                rate = random.uniform(20, 90)
                occupied_n = int(rate * total_slots / 100)
                snap = OccupancySnapshot(
                    total_slots=total_slots,
                    occupied_slots=occupied_n,
                    available_slots=total_slots - occupied_n,
                    occupancy_rate=round(rate, 1),
                    vehicle_cars=int(occupied_n * 0.7),
                    vehicle_motorcycles=int(occupied_n * 0.25),
                    vehicle_trucks=int(occupied_n * 0.05),
                    timestamp=datetime.utcnow() - timedelta(hours=23 - h, minutes=random.randint(0, 29)),
                )
                db.add(snap)

        # ── Notifications ────────────────────────────────────────
        notifications = [
            Notification(type="info", title="System Started", message="SmartPark AI has started successfully. Demo mode is active.", is_read=False),
            Notification(type="warning", title="Camera Offline", message="Camera Zone C is currently offline.", is_read=False),
            Notification(type="success", title="Slot A03 Available", message="Slot A03 is now available.", is_read=True),
        ]
        db.add_all(notifications)

        db.commit()
        print("[Seed] Database seeded successfully.")
        print("[Seed] Admin: admin@smartpark.ai / admin123")
        print("[Seed] User:  user@smartpark.ai  / user123")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()

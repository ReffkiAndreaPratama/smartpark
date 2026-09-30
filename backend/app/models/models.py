from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # user / admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    reservations = relationship("Reservation", back_populates="user")
    logs = relationship("SystemLog", back_populates="user")


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_code = Column(String(20), unique=True, index=True, nullable=False)
    zone = Column(String(10), nullable=False)
    slot_type = Column(String(20), default="car")  # car / motorcycle / vip
    status = Column(String(20), default="available")  # available / occupied / reserved / error
    is_active = Column(Boolean, default=True)
    polygon = Column(JSON, nullable=True)  # [[x,y], ...]
    floor = Column(String(10), default="G")
    vehicle_type = Column(String(20), nullable=True)
    vehicle_confidence = Column(Float, nullable=True)
    occupied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    sessions = relationship("ParkingSession", back_populates="slot")
    sensors = relationship("Sensor", back_populates="slot")
    detections = relationship("Detection", back_populates="slot")
    reservations = relationship("Reservation", back_populates="slot")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String(20), nullable=False)
    plate_number = Column(String(20), nullable=True)
    color = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=func.now())

    sessions = relationship("ParkingSession", back_populates="vehicle")


class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    entry_time = Column(DateTime, default=func.now())
    exit_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    status = Column(String(20), default="active")  # active / completed
    fee = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())

    slot = relationship("ParkingSlot", back_populates="sessions")
    vehicle = relationship("Vehicle", back_populates="sessions")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=True)
    vehicle_type = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    bbox = Column(JSON, nullable=True)  # [x1, y1, x2, y2]
    is_demo = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=func.now())

    camera = relationship("Camera", back_populates="detections")
    slot = relationship("ParkingSlot", back_populates="detections")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    source_type = Column(String(20), default="demo")  # webcam / video / rtsp / demo
    source_url = Column(String(500), nullable=True)
    status = Column(String(20), default="offline")  # online / offline
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    detections = relationship("Detection", back_populates="camera")


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(50), unique=True, nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=True)
    sensor_type = Column(String(20), default="ultrasonic")  # ultrasonic/infrared/magnetic/camera
    status = Column(String(20), default="online")  # online / offline / error
    reading = Column(Float, nullable=True)  # distance in meters
    is_occupied = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())

    slot = relationship("ParkingSlot", back_populates="sensors")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False)
    vehicle_type = Column(String(20), default="car")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # pending / active / completed / cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="reservations")
    slot = relationship("ParkingSlot", back_populates="reservations")


class OccupancySnapshot(Base):
    __tablename__ = "occupancy_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    total_slots = Column(Integer, default=0)
    occupied_slots = Column(Integer, default=0)
    available_slots = Column(Integer, default=0)
    occupancy_rate = Column(Float, default=0.0)
    vehicle_cars = Column(Integer, default=0)
    vehicle_motorcycles = Column(Integer, default=0)
    vehicle_trucks = Column(Integer, default=0)
    timestamp = Column(DateTime, default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), default="info")  # info / warning / error / success
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    slot_id = Column(Integer, nullable=True)
    sensor_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=func.now())


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="logs")

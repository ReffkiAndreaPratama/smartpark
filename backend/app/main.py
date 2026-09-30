import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from app.database.database import engine, Base
from app.models import models  # ensure models are imported for table creation
from app.api import auth, dashboard, parking, cameras, sensors, detection, sessions, history, analytics, notifications, reservations, reports, admin, ws

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed database if empty
    from scripts.seed import seed_database
    seed_database()
    # Start simulation loop
    task = asyncio.create_task(ws.simulation_loop(app))
    yield
    task.cancel()


app = FastAPI(
    title="SmartPark AI",
    description="AI-Powered Smart Parking Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(parking.router)
app.include_router(cameras.router)
app.include_router(sensors.router)
app.include_router(detection.router)
app.include_router(sessions.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(reservations.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {
        "app": "SmartPark AI",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "demo_mode": os.getenv("DEMO_MODE", "true")}

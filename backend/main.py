from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from routes import auth , stations , cars , slots 
from routes.bookings import router as booking_router
from routes.users import router as users_router
from routes.stations import get_nearby_stations
from dependencies import get_db

# Database
from database.database import engine
from models import base  # ensures models are registered

# Routers (to be added step by step)
# from routes import auth, car, station, slot, booking, admin


def create_app() -> FastAPI:
    app = FastAPI(
        title="Evora",
        description="Backend API for EV Charging Station Slot Booking Platform",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # --------------------------------------------------
    # CORS (Open for Hackathon / Frontend Dev)
    # --------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],   # tighten in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


app = create_app()

# ------------------------------------------------------
# DATABASE INITIALIZATION
# ------------------------------------------------------

@app.on_event("startup")
def startup_event():
    """
    Create all database tables.
    Hackathon-safe approach.
    """
    base.Base.metadata.create_all(bind=engine)


# ------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "running",
        "project": "Evora",
        "message": "Backend is up and running 🚀"
    }


@app.get("/health")
def health_check():
    return {"ok": True}


# ------------------------------------------------------
# ROUTER REGISTRATION (ENABLE WHEN READY)
# ------------------------------------------------------
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(stations.router, prefix="/stations", tags=["Stations"])
app.include_router(cars.router, prefix="/cars", tags=["Cars"])
app.include_router(slots.router)
app.include_router(booking_router)
app.include_router(users_router)

# app.include_router(admin.router, prefix="/admin", tags=["Admin"])
# app.include_router(car.router, prefix="/cars", tags=["Cars"])
# app.include_router(station.router, prefix="/stations", tags=["Stations"])
# app.include_router(slot.router, prefix="/slots", tags=["Slots"])
# app.include_router(booking.router, prefix="/bookings", tags=["Bookings"])

# ------------------------------------------------------
# DIRECT ROUTES
# ------------------------------------------------------

@app.get("/stations/nearby")
def nearby_proxy(lat: float, lng: float, db: Session = Depends(get_db)):
    return get_nearby_stations(lat=lat, lng=lng, db=db)

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from database.database import SessionLocal
from models.host import Host
from models.station import Station
from models.charger import Charger
from models.slot import Slot

print("Execution started")

def seed_data():
    db: Session = SessionLocal()

    # -------------------------
    # HOSTS
    # -------------------------
    host = Host(
        id=str(uuid.uuid4()),
        name="Lax EV Admin",
        email="admin@laxev.com",
        password_hash="admin"
    )
    db.add(host)
    db.commit()
    db.refresh(host)

    # -------------------------
    # STATIONS
    # -------------------------
    stations = [
        {
            "name": "Downtown EV Hub",
            "address": "City Center",
            "lat": "17.385044",
            "lng": "78.486671",
        },
        {
            "name": "Mall Parking Station",
            "address": "Central Mall",
            "lat": "17.450000",
            "lng": "78.500000",
        },
        {
            "name": "Highway Charge Point",
            "address": "NH-44",
            "lat": "17.600000",
            "lng": "78.650000",
        },
    ]

    for s in stations:
        station = Station(
            id=str(uuid.uuid4()),
            host_id=host.id,
            name=s["name"],
            address=s["address"],
            latitude=s["lat"],
            longitude=s["lng"],
            is_active=True,
        )
        db.add(station)
        db.commit()
        db.refresh(station)

        # -------------------------
        # CHARGERS
        # -------------------------
        charger = Charger(
            id=str(uuid.uuid4()),
            station_id=station.id,
            charger_type="CCS2",
            power_kw="60",
            price_per_hour=180.0
        )
        db.add(charger)
        db.commit()
        db.refresh(charger)

        # -------------------------
        # SLOTS
        # -------------------------
        start = datetime.now().replace(hour=10, minute=0, second=0)
        for i in range(4):
            slot = Slot(
                id=str(uuid.uuid4()),
                charger_id=charger.id,
                start_time=start + timedelta(hours=i),
                end_time=start + timedelta(hours=i + 1),
                is_available=True,
            )
            db.add(slot)

        db.commit()

    db.close()
    print("✅ Mock data seeded successfully")


if __name__ == "__main__":
    seed_data()
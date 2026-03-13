from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import math
from dependencies import get_db
from models.station import Station
from models.charger import Charger
from models.slot import Slot
from schema.station import StationCreate, StationOut
from datetime import datetime, date, time, timedelta
from models.booking import Booking

router = APIRouter()

def cleanup_expired_bookings(db: Session):
    now = datetime.utcnow()
    grace = timedelta(hours=24)

    # Complete bookings past grace and free their slots
    expired = (
        db.query(Booking, Slot)
        .join(Slot, Booking.slot_id == Slot.id)
        .filter(
            Booking.booking_status.in_(["PAID", "IN_PROGRESS"]),
            Slot.end_time + grace <= now
        )
        .all()
    )

    for booking, slot in expired:
        booking.booking_status = "COMPLETED"
        slot.is_available = True

    db.commit()


def roll_free_slots_forward(db: Session):
    """
    Roll ended free slots forward by 1 day to preserve daily availability cycles
    when explicit templates are not configured.
    """
    now = datetime.utcnow()
    ended_free_slots = (
        db.query(Slot)
        .filter(
            Slot.end_time <= now,
            Slot.is_available == True
        )
        .all()
    )
    for slot in ended_free_slots:
        slot.start_time = slot.start_time + timedelta(days=1)
        slot.end_time = slot.end_time + timedelta(days=1)
        slot.is_available = True
    if ended_free_slots:
        db.commit()


def haversine_distance(lat1, lng1, lat2, lng2):
    """
    Calculate distance between two lat/lng points in KM
    """
    R = 6371  # Earth radius in KM

    lat1 = math.radians(lat1)
    lng1 = math.radians(lng1)  # fixed: use lng1, not lat1
    lat2 = math.radians(lat2)
    lng2 = math.radians(lng2)

    dlat = lat2 - lat1
    dlng = lng2 - lng1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


@router.get("/nearby")
def get_nearby_stations(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """
    Returns stations sorted by distance from user location.
    Distance is calculated in KM using Haversine formula.
    """

    stations = db.query(Station).all()
    results = []

    for s in stations:
        try:
            station_lat = float(s.latitude)
            station_lng = float(s.longitude)
        except (TypeError, ValueError):
            continue

        distance = haversine_distance(
            lat, lng, station_lat, station_lng
        )

        supported_charger_types = (
            db.query(Charger.charger_type)
            .filter(Charger.station_id == s.id)
            .distinct()
            .all()
        )

        supported_charger_types = [c[0] for c in supported_charger_types]

        results.append({
            "id": s.id,
            "name": s.name,
            "address": s.address,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "distance_km": round(distance, 2),
            "supported_charger_types": supported_charger_types,
        })

    # Sort by nearest first
    results.sort(key=lambda x: x["distance_km"])

    return results


@router.get("/")
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).filter(Station.is_active == True).all()

    response = []

    for s in stations:
        # 🔑 DERIVE charger types for this station
        supported_charger_types = (
            db.query(Charger.charger_type)
            .filter(Charger.station_id == s.id)
            .distinct()
            .all()
        )

        supported_charger_types = [c[0] for c in supported_charger_types]

        response.append({
            "id": s.id,
            "name": s.name,
            "address": s.address,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "supported_charger_types": supported_charger_types,
        })

    return response


@router.get("/{station_id}")
def get_station(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return {
        "id": station.id,
        "name": station.name,
        "address": station.address,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "is_active": station.is_active,
    }


@router.get("/{station_id}/chargers")
def get_station_chargers(station_id: str, db: Session = Depends(get_db)):
    chargers = (
        db.query(Charger)
        .filter(Charger.station_id == station_id)
        .all()
    )
    return [
        {
            "id": c.id,
            "charger_type": c.charger_type,
            "power_kw": c.power_kw,
            "price_per_hour": c.price_per_hour,
        }
        for c in chargers
    ]


@router.get("/{station_id}/chargers-with-slots")
def get_station_chargers_with_slots(station_id: str, db: Session = Depends(get_db)):
    # 🔑 CLEANUP FIRST
    cleanup_expired_bookings(db)
    # 🔁 Roll forward ended free slots to maintain daily cycles
    roll_free_slots_forward(db)

    chargers = (
        db.query(Charger)
        .filter(Charger.station_id == station_id)
        .all()
    )
    charger_ids = [c.id for c in chargers]

    # ensure daily regeneration based on templates
    if charger_ids:
        ensure_today_slots(db, station_id, charger_ids)

    slots = []
    if charger_ids:
        # Only return FUTURE slots (start_time > now)
        from datetime import datetime
        now = datetime.utcnow()
        slots = (
            db.query(Slot)
            .filter(
                Slot.charger_id.in_(charger_ids),
                Slot.start_time > now  # Only future slots
            )
            .order_by(Slot.start_time)
            .all()
        )

    slots_by_charger = {}
    for s in slots:
        slots_by_charger.setdefault(s.charger_id, []).append({
            "id": s.id,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "is_available": s.is_available,
        })

    return [
        {
            "id": c.id,
            "name": getattr(c, "name", None),
            "charger_type": c.charger_type,
            "power_kw": c.power_kw,
            "price_per_hour": c.price_per_hour,
            "slots": slots_by_charger.get(c.id, []),
        }
        for c in chargers
    ]


@router.post("/", response_model=StationOut)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    db_station = Station(
        name=station.name,
        address=station.address,
        latitude=station.latitude,
        longitude=station.longitude,
        host_id=station.host_id,
        is_active=True
    )
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station


@router.get("/{station_id}/availability")
def get_station_availability(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Public, read-only availability endpoint.
    Safe for booking flow.
    """

    charger_ids = (
        db.query(Charger.id)
        .filter(Charger.station_id == station_id)
        .all()
    )

    charger_ids = [c[0] for c in charger_ids]

    if not charger_ids:
        return {
            "available_slots": 0,
            "total_slots": 0
        }

    # Only count FUTURE slots
    from datetime import datetime
    now = datetime.utcnow()

    total_slots = (
        db.query(Slot)
        .filter(
            Slot.charger_id.in_(charger_ids),
            Slot.start_time > now  # Only future slots
        )
        .count()
    )

    available_slots = (
        db.query(Slot)
        .filter(
            Slot.charger_id.in_(charger_ids),
            Slot.is_available == True,
            Slot.start_time > now  # Only future slots
        )
        .count()
    )

    return {
        "available_slots": available_slots,
        "total_slots": total_slots
    }


@router.get("/{station_id}/slots")
def get_station_slots(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Booking-safe endpoint.
    Returns ONLY available slots.
    """

    # 🔑 CLEANUP FIRST
    cleanup_expired_bookings(db)
    # 🔁 Roll forward ended free slots to maintain daily cycles
    roll_free_slots_forward(db)

    # ensure daily regeneration based on templates
    charger_ids = (
        db.query(Charger.id)
        .filter(Charger.station_id == station_id)
        .all()
    )
    charger_ids_list = [c[0] for c in charger_ids]
    if charger_ids_list:
        ensure_today_slots(db, station_id, charger_ids_list)

    slots = (
        db.query(Slot, Charger)
        .join(Charger, Slot.charger_id == Charger.id)
        .filter(
            Charger.station_id == station_id,
            Slot.is_available == True  # 🔒 CRITICAL LINE
        )
        .order_by(Slot.start_time)
        .all()
    )

    return [
        {
            "id": slot.id,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_available": slot.is_available,
            "price_per_hour": charger.price_per_hour,
            "charger_type": charger.charger_type,
        }
        for slot, charger in slots
    ]

@router.post("/{station_id}/slots")
def add_slot_to_station(
    station_id: str,
    slot_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    charger_id = slot_data.get("charger_id")
    start_time_str = slot_data.get("start_time")  # e.g. "08:00"
    end_time_str = slot_data.get("end_time")      # e.g. "09:00"

    if not charger_id or not start_time_str or not end_time_str:
        raise HTTPException(status_code=400, detail="Missing required fields")
    def parse_datetime(value: str) -> datetime:
        try:
            # Case 1: ISO datetime (frontend sends this)
            return datetime.fromisoformat(value)
        except ValueError:
            try:
                # Case 2: HH:MM fallback
                today = date.today()
                return datetime.combine(
                    today,
                    datetime.strptime(value, "%H:%M").time()
                )
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid datetime format"
                )

    start_time = parse_datetime(start_time_str)
    end_time = parse_datetime(end_time_str)

    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    new_slot = Slot(
        charger_id=charger_id,
        start_time=start_time,   # ✅ datetime
        end_time=end_time,       # ✅ datetime
        is_available=True
    )

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    return {"id": new_slot.id}

@router.post("/{station_id}/chargers")
def add_charger_to_station(
    station_id: str,
    charger_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    charger_type = charger_data.get("charger_type")
    power_kw = charger_data.get("power_kw")
    if not charger_type or not power_kw:
        raise HTTPException(status_code=400, detail="Missing required fields")
    new_charger = Charger(
        station_id=station_id,
        charger_type=charger_type,
        power_kw=power_kw,
        price_per_hour=charger_data.get("price_per_hour", 100)
    )
    db.add(new_charger)
    db.commit()
    db.refresh(new_charger)
    
    # Automatically create 6 available slots for the new charger
    now = datetime.now()
    next_hour = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    for i in range(6):
        slot = Slot(
            charger_id=new_charger.id,
            start_time=next_hour + timedelta(hours=i),
            end_time=next_hour + timedelta(hours=i + 1),
            is_available=True
        )
        db.add(slot)
    db.commit()
    
    return {"id": new_charger.id}

@router.put("/{station_id}")
def update_station(station_id: str, data: dict = Body(...), db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    for key in ["name", "address", "latitude", "longitude", "is_active"]:
        if key in data:
            setattr(station, key, data[key])
    db.commit()
    db.refresh(station)
    return {
        "id": station.id,
        "name": station.name,
        "address": station.address,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "is_active": station.is_active,
    }

@router.delete("/chargers/{charger_id}")
def delete_charger(charger_id: str, db: Session = Depends(get_db)):
    charger = db.query(Charger).filter(Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    # delete slots for this charger
    db.query(Slot).filter(Slot.charger_id == charger_id).delete()
    db.delete(charger)
    db.commit()
    return {"deleted": True}


def ensure_today_slots(db: Session, station_id: str, charger_ids: list[str]):
    today = date.today()
    # check if there are slots for today already
    existing_today = (
        db.query(Slot)
        .filter(
            Slot.charger_id.in_(charger_ids),
            Slot.start_time >= datetime.combine(today, time(0,0)),
            Slot.end_time <= datetime.combine(today, time(23,59,59))
        )
        .count()
    )
    if existing_today > 0:
        return
    # get any historical slots to serve as templates (hour ranges)
    templates = (
        db.query(Slot)
        .filter(Slot.charger_id.in_(charger_ids))
        .order_by(Slot.start_time)
        .all()
    )
    hour_ranges_by_charger: dict[str, set[tuple[int,int]]] = {}
    for s in templates:
        start_h = s.start_time.hour
        end_h = s.end_time.hour
        hour_ranges_by_charger.setdefault(s.charger_id, set()).add((start_h, end_h))
    # create today's slots per template
    for cid, ranges in hour_ranges_by_charger.items():
        for (sh, eh) in ranges:
            start_dt = datetime.combine(today, time(sh, 0))
            end_dt = datetime.combine(today, time(eh, 0))
            new_slot = Slot(
                charger_id=cid,
                start_time=start_dt,
                end_time=end_dt,
                is_available=True
            )
            db.add(new_slot)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models.slot import Slot
from models.charger import Charger
from models.booking import Booking
from models.car import Car
from models.user import User
from models.station import Station
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/slots", tags=["slots"])


@router.get("/count")
def get_available_slots_count(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns number of available slots for a station.
    Read-only. No booking here.
    """

    # get all chargers of this station
    chargers = (
        db.query(Charger.id)
        .filter(Charger.station_id == station_id)
        .all()
    )

    charger_ids = [c[0] for c in chargers]

    if not charger_ids:
        return {"available_slots": 0}

    # count available slots
    count = (
        db.query(Slot)
        .filter(
            Slot.charger_id.in_(charger_ids),
            Slot.is_available == True
        )
        .count()
    )

    return {
        "available_slots": count
    }



@router.get("/admin/slots")
def get_admin_slots(db: Session = Depends(get_db)):
    results = (
    db.query(Slot, Booking, Car, User, Charger, Station)
    .join(Charger, Slot.charger_id == Charger.id)
    .join(Station, Charger.station_id == Station.id)
    .outerjoin(Booking, Booking.slot_id == Slot.id)
    .outerjoin(Car, Car.id == Booking.car_id)
    .outerjoin(User, User.id == Booking.user_id)
    .order_by(Slot.start_time)
    .all()
)

    response = []

    for slot, booking, car, user, charger, station in results:
        response.append({
        "slot_id": slot.id,

        # ✅ NOW THIS EXISTS
        "station_id": station.id,
        "station_name": station.name,

        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "is_available": slot.is_available,
        "is_emergency_reserved": getattr(slot, 'is_emergency_reserved', False),
        "charger_type": charger.charger_type,

        "booking": None if not booking else {
            "booking_id": booking.id,
            "status": booking.booking_status,
            "user": None if not user else {
                "id": user.id,
                "name": user.name,
            },
            "car": None if not car else {
                "brand": car.brand,
                "model": car.model,
                "car_number": car.car_number,
            },
        },
    })

    return response


@router.post("/reset/{slot_id}")
def reset_slot(slot_id: str, db: Session = Depends(get_db)):
    """Reset a slot to make it available again (for testing)"""
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    slot.is_available = True
    db.commit()
    return {"message": "Slot reset successfully", "slot_id": slot_id}


@router.post("/reset-station/{station_id}")
def reset_station_slots(station_id: str, db: Session = Depends(get_db)):
    """Reset all slots for a station to make them available (for testing)"""
    chargers = db.query(Charger).filter(Charger.station_id == station_id).all()
    charger_ids = [c.id for c in chargers]
    
    if not charger_ids:
        raise HTTPException(status_code=404, detail="No chargers found for station")
    
    updated = db.query(Slot).filter(Slot.charger_id.in_(charger_ids)).update(
        {"is_available": True}, synchronize_session=False
    )
    db.commit()
    return {"message": f"Reset {updated} slots for station", "station_id": station_id}


@router.post("/generate/{charger_id}")
def generate_slots_for_charger(charger_id: str, db: Session = Depends(get_db)):
    """Generate new time slots for a charger for the next 3 days"""
    charger = db.query(Charger).filter(Charger.id == charger_id).first()
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    
    now = datetime.utcnow()
    # Round to next hour
    start = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    
    created_slots = []
    for day in range(3):  # Next 3 days
        for hour in range(8, 22):  # 8 AM to 10 PM
            slot_start = start.replace(hour=hour) + timedelta(days=day)
            if slot_start <= now:
                continue
            slot_end = slot_start + timedelta(hours=1)
            
            # Check if slot already exists
            existing = db.query(Slot).filter(
                Slot.charger_id == charger_id,
                Slot.start_time == slot_start
            ).first()
            
            if not existing:
                new_slot = Slot(
                    id=str(uuid.uuid4()),
                    charger_id=charger_id,
                    start_time=slot_start,
                    end_time=slot_end,
                    is_available=True
                )
                db.add(new_slot)
                created_slots.append({
                    "start": slot_start.isoformat(),
                    "end": slot_end.isoformat()
                })
    
    db.commit()
    return {"message": f"Created {len(created_slots)} new slots", "charger_id": charger_id}


@router.post("/generate-for-station/{station_id}")
def generate_slots_for_station(station_id: str, db: Session = Depends(get_db)):
    """Generate new time slots for ALL chargers in a station for the next 3 days"""
    chargers = db.query(Charger).filter(Charger.station_id == station_id).all()
    if not chargers:
        raise HTTPException(status_code=404, detail="No chargers found for station")
    
    now = datetime.utcnow()
    start = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    
    total_created = 0
    for charger in chargers:
        for day in range(3):
            for hour in range(8, 22):
                slot_start = start.replace(hour=hour) + timedelta(days=day)
                if slot_start <= now:
                    continue
                slot_end = slot_start + timedelta(hours=1)
                
                existing = db.query(Slot).filter(
                    Slot.charger_id == charger.id,
                    Slot.start_time == slot_start
                ).first()
                
                if not existing:
                    new_slot = Slot(
                        id=str(uuid.uuid4()),
                        charger_id=charger.id,
                        start_time=slot_start,
                        end_time=slot_end,
                        is_available=True
                    )
                    db.add(new_slot)
                    total_created += 1
    
    db.commit()
    return {"message": f"Created {total_created} new slots for {len(chargers)} chargers", "station_id": station_id}


@router.patch("/{slot_id}/emergency-reserved")
def toggle_emergency_reserved(slot_id: str, data: dict, db: Session = Depends(get_db)):
    """Toggle the emergency reserved status of a slot"""
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    is_emergency_reserved = data.get("is_emergency_reserved", False)
    slot.is_emergency_reserved = is_emergency_reserved
    db.commit()
    
    return {
        "message": "Slot updated successfully",
        "slot_id": slot_id,
        "is_emergency_reserved": is_emergency_reserved
    }


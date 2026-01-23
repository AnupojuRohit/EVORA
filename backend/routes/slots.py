from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db
from models.slot import Slot
from models.charger import Charger
from models.booking import Booking
from models.car import Car
from models.user import User
from models.station import Station

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


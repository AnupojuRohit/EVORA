from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List
from models.booking import Booking
from dependencies import get_db, get_current_user
from schema.booking import BookingOut
from models.slot import Slot

router = APIRouter(prefix="/bookings", tags=["Bookings"])




@router.post("")
def create_booking(
    data: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),  # 🔑 string user_id
):
    # Prevent duplicate order
    existing = (
        db.query(Booking)
        .filter(Booking.order_id == data["order_id"])
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Booking already exists")

    # Fetch slot
    slot = db.query(Slot).filter(Slot.id == data["slot_id"]).first()
    if not slot or not slot.is_available:
        raise HTTPException(status_code=400, detail="Slot not available")

    # Lock slot
    slot.is_available = False

    booking = Booking(
        id=str(uuid.uuid4()),
        user_id=current_user,  # ✅ DIRECTLY USE STRING
        car_id=data["car_id"],
        slot_id=data["slot_id"],
        station_id=data["station_id"],
        order_id=data["order_id"],
        transaction_id=data["transaction_id"],
        ticket_id="TICKET-" + uuid.uuid4().hex[:10].upper(),
        amount=data["amount"],
        booking_status="PAID",
        created_at=datetime.utcnow(),
    )

    db.add(booking)
    db.commit()

    return {
        "booking_id": booking.id,
        "ticket_id": booking.ticket_id,
    }


@router.get("")
def get_user_bookings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for b in bookings:
        # Get slot info for start_time and end_time
        slot = db.query(Slot).filter(Slot.id == b.slot_id).first()
        result.append({
            "id": b.id,
            "station_id": b.station_id,
            "slot_id": b.slot_id,
            "order_id": b.order_id,
            "transaction_id": b.transaction_id,
            "ticket_id": b.ticket_id,
            "amount": b.amount,
            "status": b.booking_status,
            "booking_type": getattr(b, 'booking_type', 'standard'),
            "vehicle_number": getattr(b, 'vehicle_number', None),
            "arrival_confirmed": getattr(b, 'arrival_confirmed', False),
            "charging_started": getattr(b, 'charging_started', False),
            "created_at": b.created_at,
            "start_time": slot.start_time if slot else None,
            "end_time": slot.end_time if slot else None,
        })
    return result


@router.get("/{booking_id}")
def get_booking_by_id(
    booking_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get a single booking by ID"""
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    
    if not booking:
        # Also try finding by ticket_id
        booking = db.query(Booking).filter(Booking.ticket_id == booking_id, Booking.user_id == user_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get slot info
    slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()
    
    # Get station info
    from models.station import Station
    station = db.query(Station).filter(Station.id == booking.station_id).first()
    
    # Get charger info for charger_type
    from models.charger import Charger
    charger = db.query(Charger).filter(Charger.id == slot.charger_id).first() if slot else None
    
    return {
        "id": booking.id,
        "station_id": booking.station_id,
        "slot_id": booking.slot_id,
        "order_id": booking.order_id,
        "transaction_id": booking.transaction_id,
        "ticket_id": booking.ticket_id,
        "amount": booking.amount,
        "status": booking.booking_status,
        "booking_type": getattr(booking, 'booking_type', 'standard'),
        "vehicle_number": getattr(booking, 'vehicle_number', None),
        "arrival_confirmed": getattr(booking, 'arrival_confirmed', False),
        "charging_started": getattr(booking, 'charging_started', False),
        "created_at": booking.created_at,
        "start_time": slot.start_time if slot else None,
        "end_time": slot.end_time if slot else None,
        "charger_type": charger.charger_type if charger else None,
        "station": {
            "id": station.id,
            "name": station.name,
            "address": station.address,
            "latitude": station.latitude,
            "longitude": station.longitude,
        } if station else None
    }


# Emergency Booking Request (User side)
@router.post("/emergency-request")
def create_emergency_request(
    data: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Create an emergency booking request that awaits station approval"""
    booking = Booking(
        id=str(uuid.uuid4()),
        user_id=current_user,
        car_id=data.get("car_id"),
        slot_id=None,  # Will be assigned by operator
        station_id=data["station_id"],
        order_id="EMG-" + uuid.uuid4().hex[:10].upper(),
        transaction_id="PENDING",
        ticket_id="TICKET-" + uuid.uuid4().hex[:10].upper(),
        amount=0,  # To be determined
        booking_status="PENDING_APPROVAL",
        booking_type="emergency_requested",
        vehicle_number=data.get("vehicle_number", "").upper(),
        notes=data.get("notes"),
        created_at=datetime.utcnow(),
    )
    
    db.add(booking)
    db.commit()
    
    return {
        "booking_id": booking.id,
        "ticket_id": booking.ticket_id,
        "status": "PENDING_APPROVAL",
        "message": "Your emergency request has been submitted. Waiting for station approval."
    }


# Admin: Create Walk-In Booking
@router.post("/walk-in")
def create_walkin_booking(
    data: dict,
    db: Session = Depends(get_db),
):
    """Admin creates a walk-in booking for on-site customer"""
    slot_id = data.get("slot_id")
    
    # Validate and lock slot
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot or not slot.is_available:
        raise HTTPException(status_code=400, detail="Slot not available")
    
    slot.is_available = False
    
    booking = Booking(
        id=str(uuid.uuid4()),
        user_id=data.get("user_id"),  # Optional - may not have account
        car_id=data.get("car_id"),
        slot_id=slot_id,
        station_id=data["station_id"],
        order_id="WALK-" + uuid.uuid4().hex[:10].upper(),
        transaction_id="CASH-" + uuid.uuid4().hex[:6].upper(),
        ticket_id="TICKET-" + uuid.uuid4().hex[:10].upper(),
        amount=data.get("amount", 0),
        booking_status="PAID",
        booking_type="emergency" if data.get("is_emergency") else "walk_in",
        vehicle_number=data.get("vehicle_number", "").upper(),
        customer_name=data.get("user_name"),
        customer_phone=data.get("user_phone"),
        created_at=datetime.utcnow(),
    )
    
    db.add(booking)
    db.commit()
    
    return {
        "booking_id": booking.id,
        "ticket_id": booking.ticket_id,
        "status": "PAID",
    }


# Admin: Approve Emergency Request
@router.post("/approve-emergency/{booking_id}")
def approve_emergency_booking(
    booking_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    """Admin approves emergency request and assigns slot"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.booking_type != "emergency_requested":
        raise HTTPException(status_code=400, detail="Not an emergency request")
    
    slot_id = data.get("slot_id")
    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot or not slot.is_available:
        raise HTTPException(status_code=400, detail="Slot not available")
    
    slot.is_available = False
    booking.slot_id = slot_id
    booking.booking_status = "PAID"
    booking.booking_type = "emergency"
    booking.amount = data.get("amount", 0)
    booking.transaction_id = "EMG-APPROVED-" + uuid.uuid4().hex[:6].upper()
    
    db.commit()
    
    return {
        "booking_id": booking.id,
        "ticket_id": booking.ticket_id,
        "status": "APPROVED",
    }


# Verify booking by identifier (for manual arrival)
@router.get("/verify")
def verify_booking(
    identifier: str,
    search_type: str = "vehicle_number",  # vehicle_number, ticket_id, booking_id
    db: Session = Depends(get_db),
):
    """Find booking by vehicle number, ticket ID, or booking ID"""
    booking = None
    
    if search_type == "vehicle_number":
        booking = db.query(Booking).filter(
            Booking.vehicle_number == identifier.upper(),
            Booking.booking_status.in_(["PAID", "IN_PROGRESS"])
        ).order_by(Booking.created_at.desc()).first()
    elif search_type == "ticket_id":
        booking = db.query(Booking).filter(Booking.ticket_id == identifier.upper()).first()
    else:  # booking_id
        booking = db.query(Booking).filter(Booking.id == identifier).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    slot = db.query(Slot).filter(Slot.id == booking.slot_id).first()
    
    return {
        "id": booking.id,
        "ticket_id": booking.ticket_id,
        "vehicle_number": booking.vehicle_number or "",
        "user_name": getattr(booking, 'customer_name', None),
        "charger_type": slot.charger_type if slot else "DC",
        "start_time": slot.start_time if slot else None,
        "end_time": slot.end_time if slot else None,
        "amount": booking.amount,
        "booking_type": getattr(booking, 'booking_type', 'standard'),
        "arrival_confirmed": getattr(booking, 'arrival_confirmed', False),
        "charging_started": getattr(booking, 'charging_started', False),
    }


# Confirm arrival manually
@router.post("/confirm-arrival/{booking_id}")
def confirm_arrival(
    booking_id: str,
    db: Session = Depends(get_db),
):
    """Manually confirm customer arrival"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.arrival_confirmed = True
    db.commit()
    
    return {"ok": True, "message": "Arrival confirmed"}


# Start charging session manually
@router.post("/start-charging/{booking_id}")
def start_charging(
    booking_id: str,
    db: Session = Depends(get_db),
):
    """Manually start charging session"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if not getattr(booking, 'arrival_confirmed', False):
        raise HTTPException(status_code=400, detail="Arrival not confirmed")
    
    booking.charging_started = True
    booking.booking_status = "IN_PROGRESS"
    db.commit()
    
    return {"ok": True, "message": "Charging started"}


# Get all bookings (admin)
@router.get("/all")
def get_all_bookings(
    db: Session = Depends(get_db),
):
    """Get all bookings for admin dashboard"""
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    result = []
    for b in bookings:
        slot = db.query(Slot).filter(Slot.id == b.slot_id).first()
        result.append({
            "id": b.id,
            "user_id": b.user_id,
            "station_id": b.station_id,
            "slot_id": b.slot_id,
            "order_id": b.order_id,
            "ticket_id": b.ticket_id,
            "amount": b.amount,
            "status": b.booking_status,
            "booking_type": getattr(b, 'booking_type', 'standard'),
            "vehicle_number": getattr(b, 'vehicle_number', None),
            "customer_name": getattr(b, 'customer_name', None),
            "arrival_confirmed": getattr(b, 'arrival_confirmed', False),
            "charging_started": getattr(b, 'charging_started', False),
            "created_at": b.created_at,
            "start_time": slot.start_time if slot else None,
            "end_time": slot.end_time if slot else None,
        })
    return result

@router.get("/bookings", response_model=List[BookingOut])
def get_bookings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )

@router.post("/start")
def start_booking(
    data: dict,
    db: Session = Depends(get_db),
):
    ticket_id = data.get("ticket_id")
    if not ticket_id:
        raise HTTPException(status_code=400, detail="ticket_id required")

    booking = db.query(Booking).filter(Booking.ticket_id == ticket_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # mark booking in progress; slot remains unavailable until end_time
    booking.booking_status = "IN_PROGRESS"
    db.commit()
    return {"ok": True, "booking_id": booking.id}
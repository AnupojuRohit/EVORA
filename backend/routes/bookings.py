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




@router.post("/")
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


@router.get("/")
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
    return [
        {
            "id": b.id,
            "station_id": b.station_id,
            "slot_id": b.slot_id,
            "order_id": b.order_id,
            "transaction_id": b.transaction_id,
            "ticket_id": b.ticket_id,
            "amount": b.amount,
            "status": b.booking_status,
            "created_at": b.created_at,
        }
        for b in bookings
    ]

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
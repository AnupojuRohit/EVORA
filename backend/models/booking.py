from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
import uuid
from sqlalchemy import Float
from models.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    car_id = Column(String, ForeignKey("cars.id"))
    slot_id = Column(String, ForeignKey("slots.id"))
    station_id = Column(String, ForeignKey("stations.id"))

    order_id = Column(String, unique=True, nullable=False)
    transaction_id = Column(String, nullable=False)
    ticket_id = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    booking_status = Column(String, default="PAID")
    booking_type = Column(String, default="standard")  # standard, emergency, walk_in, emergency_requested
    vehicle_number = Column(String, nullable=True)  # For walk-in bookings without user account
    customer_name = Column(String, nullable=True)  # For walk-in customers
    customer_phone = Column(String, nullable=True)  # For walk-in customers
    arrival_confirmed = Column(Boolean, default=False)
    charging_started = Column(Boolean, default=False)
    notes = Column(String, nullable=True)  # For emergency/walk-in notes
    created_at = Column(DateTime)
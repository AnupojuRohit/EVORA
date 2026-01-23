from sqlalchemy import Column, String, DateTime, ForeignKey
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
    ticket_id = Column(String, unique=True, nullable=False)  # ✅ ADD THIS
    amount = Column(Float, nullable=False)
    booking_status = Column(String, default="PAID")
    created_at = Column(DateTime)
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
import uuid

from models.base import Base


class Slot(Base):
    __tablename__ = "slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    charger_id = Column(String, ForeignKey("chargers.id"), nullable=False)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    is_available = Column(Boolean, default=True)
    is_emergency_reserved = Column(Boolean, default=False)  # Reserved for emergency bookings only

from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
import uuid

from models.base import Base


class Car(Base):
    __tablename__ = "cars"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    car_number = Column(String, unique=True, nullable=False)
    charger_type = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)

    google_id = Column(String, nullable=True)

    home_lat = Column(String, nullable=True)
    home_lng = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

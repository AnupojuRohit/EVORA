from sqlalchemy import Column, String, ForeignKey , Float
import uuid

from models.base import Base


class Charger(Base):
    __tablename__ = "chargers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    station_id = Column(String, ForeignKey("stations.id"), nullable=False)

    charger_type = Column(String, nullable=False)
    power_kw = Column(String, nullable=False)

    price_per_hour = Column(Float, nullable=False)
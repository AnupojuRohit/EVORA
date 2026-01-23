from schema.base import BaseSchema
from datetime import datetime
from typing import Optional


class BookingCreate(BaseSchema):
    car_id: str
    slot_id: str
    station_id: str
    amount: str


class BookingOut(BaseSchema):
    id: str
    booking_status: str
    order_id: str
    transaction_id: Optional[str]
    amount: str
    created_at: datetime

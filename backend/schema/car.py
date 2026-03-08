from schema.base import BaseSchema
from datetime import datetime


class CarCreate(BaseSchema):
    brand: str
    model: str
    car_number: str
    charger_type: str


class CarOut(BaseSchema):
    id: str
    brand: str
    model: str
    car_number: str
    charger_type: str
    purchase_date: str | None = None
    purchase_city: str | None = None
    created_at: datetime

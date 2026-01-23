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
    created_at: datetime

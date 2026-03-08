from schema.base import BaseSchema
from datetime import datetime


class StationCreate(BaseSchema):
    name: str
    address: str
    latitude: str
    longitude: str
    host_id: str


class StationOut(BaseSchema):
    id: str
    name: str
    address: str
    latitude: str
    longitude: str
    is_active: bool
    created_at: datetime

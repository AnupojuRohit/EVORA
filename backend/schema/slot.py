from schema.base import BaseSchema
from datetime import datetime


class SlotCreate(BaseSchema):
    start_time: datetime
    end_time: datetime


class SlotOut(BaseSchema):
    id: str
    start_time: datetime
    end_time: datetime
    is_available: bool

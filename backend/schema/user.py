from schema.base import BaseSchema
from typing import Optional
from datetime import datetime


class UserOut(BaseSchema):
    id: str
    name: str
    email: str
    home_lat: Optional[str]
    home_lng: Optional[str]
    created_at: datetime

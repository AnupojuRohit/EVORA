from schema.base import BaseSchema
from datetime import datetime


class AdminOut(BaseSchema):
    id: str
    name: str
    email: str
    created_at: datetime

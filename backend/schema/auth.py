from schema.base import BaseSchema


class UserRegister(BaseSchema):
    name: str
    email: str
    password: str


class UserLogin(BaseSchema):
    email: str
    password: str


class AdminRegister(BaseSchema):
    name: str
    email: str
    password: str


class AdminLogin(BaseSchema):
    email: str
    password: str


class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"

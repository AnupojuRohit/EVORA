from datetime import datetime, timedelta
from typing import Optional

from fastapi import Request
from jose import jwt
from fastapi import Request, HTTPException, status
from database.database import SessionLocal

# ======================================================
# DATABASE DEPENDENCY
# ======================================================

def get_db():
    """
    Provides a database session.
    Always closes cleanly.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ======================================================
# JWT CONFIG (HACKATHON SAFE)
# ======================================================

SECRET_KEY = "LAX_EV_HACKATHON_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
):
    """
    Creates JWT access token.
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    """
    Decodes JWT token.

    - NEVER raises error
    - Returns payload or None
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None




def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    token = auth_header.replace("Bearer ", "")

    payload = decode_access_token(token)

    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return payload["user_id"]
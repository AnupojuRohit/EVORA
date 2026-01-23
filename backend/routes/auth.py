from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import bcrypt
from dependencies import get_db, create_access_token, get_current_user
from models.user import User
from models.host import Host
from schema.auth import (
    UserLogin,
    UserRegister,
    AdminLogin,
    AdminRegister,
    TokenResponse,
)

router = APIRouter()

# =====================================================
# USER AUTH
# =====================================================

@router.post("/register", response_model=TokenResponse)
def user_register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    """
    User registration (secure).
    - Checks for duplicate email
    - Hashes password
    """
    if db.query(User).filter(User.email == payload.email).first():
        raise Exception("Email already registered")

    hashed_pw = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    user = User(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pw,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({
        "user_id": user.id,
        "role": "user",
    })
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=TokenResponse)
def user_login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not bcrypt.checkpw(
        payload.password.encode(),
        user.password_hash.encode()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({
        "user_id": user.id,
        "role": "user",
    })

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.post("/change-password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_password = data.get("old_password")
    new_password = data.get("new_password")
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Missing fields")

    if not bcrypt.checkpw(old_password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"success": True}

# =====================================================
# ADMIN / HOST AUTH
# =====================================================

@router.post("/admin/register", response_model=TokenResponse)
def admin_register(
    payload: AdminRegister,
    db: Session = Depends(get_db),
):
    """
    Admin (host) registration (secure).
    - Checks for duplicate email
    - Hashes password
    """
    if db.query(Host).filter(Host.email == payload.email).first():
        raise Exception("Email already registered")
    hashed_pw = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()
    admin = Host(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        password_hash=hashed_pw,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token({
        "admin_id": admin.id,
        "role": "admin",
    })
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(
    payload: AdminLogin,
    db: Session = Depends(get_db),
):
    """
    Admin login (secure).
    - Checks password hash
    - No auto-create
    """
    admin = db.query(Host).filter(Host.email == payload.email).first()
    if not admin or not bcrypt.checkpw(payload.password.encode(), admin.password_hash.encode()):
        raise Exception("Invalid credentials")
    token = create_access_token({
        "admin_id": admin.id,
        "role": "admin",
    })
    return {
        "access_token": token,
        "token_type": "bearer",
    }

# =====================================================
# GOOGLE AUTH (STUB)
# =====================================================

@router.get("/google")
def google_auth_stub():
    """
    Stub so frontend Google login/signup does not break.
    """
    return {
        "message": "Google auth not implemented yet (hackathon stub)"
    }

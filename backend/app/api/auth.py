from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User, SystemLog
from app.schemas.schemas import UserRegister, UserLogin, UserOut, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role if data.role in ("user", "admin") else "user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(SystemLog(user_id=user.id, action="REGISTER", description=f"User {user.email} registered"))
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    db.add(SystemLog(user_id=user.id, action="LOGIN", description=f"User {user.email} logged in"))
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

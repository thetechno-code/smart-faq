from fastapi import APIRouter, HTTPException
from backend.models.user import UserCreate, UserLogin
from backend.database.database import get_connection
from backend.services.auth_service import create_user, authenticate_user

router = APIRouter()

@router.post("/register")
def register(payload: UserCreate):
    try:
        user = create_user(payload)
        return {"message": "User registered", "user": user}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/login")
def login(payload: UserLogin):
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "user": user}

from fastapi import APIRouter
from backend.services.history_service import get_search_history

router = APIRouter()

@router.get("/")
def history():
    return get_search_history()

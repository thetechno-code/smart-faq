from fastapi import APIRouter
from backend.schemas.faq import FAQCreate, SearchRequest
from backend.services.faq_service import (
    get_all_faq,
    create_faq,
    search_exact_match,
    search_semantic,
)
from backend.services.history_service import record_search_history

router = APIRouter()

@router.get("/")
def list_faq():
    return get_all_faq()

@router.post("/")
def create(payload: FAQCreate):
    return create_faq(payload)

@router.post("/search")
def search(payload: SearchRequest):
    exact = search_exact_match(payload)
    if exact:
        record_search_history(
            user_id=None,
            layanan=payload.layanan,
            kode_error=payload.kode_error,
            query_text=payload.query_text,
            result_found=True,
            similarity_score=1.0,
        )
        return {"source": "exact", "results": exact}

    semantic = search_semantic(payload)
    score = semantic[0]["similarity_score"] if semantic else 0.0
    record_search_history(
        user_id=None,
        layanan=payload.layanan,
        kode_error=payload.kode_error,
        query_text=payload.query_text,
        result_found=bool(semantic),
        similarity_score=score,
    )
    return {"source": "semantic", "results": semantic}

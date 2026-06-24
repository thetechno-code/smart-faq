from typing import Optional
from pydantic import BaseModel


class FAQCreate(BaseModel):
    layanan: str
    kode_error: str
    deskripsi_error: str
    penyebab: str
    solusi: str


class FAQResponse(FAQCreate):
    id: int


class SearchRequest(BaseModel):
    layanan: Optional[str] = None
    kode_error: Optional[str] = None
    query_text: Optional[str] = None

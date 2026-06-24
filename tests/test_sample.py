from backend.database.database import init_db
from backend.schemas.faq import FAQCreate
from backend.services.faq_service import create_faq


def test_create_faq_payload():
    payload = FAQCreate(
        layanan="Login Service",
        kode_error="ERR-1001",
        deskripsi_error="Login gagal",
        penyebab="Token expired",
        solusi="Login ulang"
    )
    assert payload.layanan == "Login Service"


def test_database_init_runs():
    init_db()
    assert True

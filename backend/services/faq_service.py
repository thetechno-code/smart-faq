from backend.database.database import get_connection
from backend.schemas.faq import SearchRequest


def get_all_faq():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM faq ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def create_faq(payload):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO faq (layanan, kode_error, deskripsi_error, penyebab, solusi) VALUES (?, ?, ?, ?, ?)",
        (
            payload.layanan,
            payload.kode_error,
            payload.deskripsi_error,
            payload.penyebab,
            payload.solusi,
        ),
    )
    conn.commit()
    faq_id = cursor.lastrowid
    conn.close()
    return {"id": faq_id, **payload.model_dump()}


def search_exact_match(payload: SearchRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM faq WHERE layanan = ? AND kode_error = ?",
        (payload.layanan, payload.kode_error),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def search_semantic(payload: SearchRequest):
    from backend.ml.search import search_semantic_index

    query = payload.query_text or f"{payload.layanan} {payload.kode_error}"
    results = search_semantic_index(query)
    return results

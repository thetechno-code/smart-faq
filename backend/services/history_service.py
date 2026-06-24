from backend.database.database import get_connection


def record_search_history(user_id, layanan, kode_error, query_text, result_found, similarity_score):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO search_history (user_id, layanan, kode_error, query_text, result_found, similarity_score) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, layanan, kode_error, query_text, 1 if result_found else 0, similarity_score),
    )
    conn.commit()
    conn.close()


def get_search_history():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM search_history ORDER BY created_at DESC LIMIT 50"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

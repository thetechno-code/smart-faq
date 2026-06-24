from backend.database.database import get_connection
from passlib.hash import bcrypt


def create_user(payload):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        (payload.name, str(payload.email), bcrypt.hash(payload.password), payload.role),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return {"id": user_id, "name": payload.name, "email": str(payload.email), "role": payload.role}


def authenticate_user(email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (str(email),))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return None
    if not bcrypt.verify(password, user["password"]):
        return None
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}

from backend.database.database import get_connection
import pandas as pd


def get_analytics():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM search_history")
    rows = cursor.fetchall()
    conn.close()
    df = pd.DataFrame([dict(row) for row in rows])
    if df.empty:
        return {
            "total_searches": 0,
            "successful_searches": 0,
            "failure_rate": 0,
            "top_services": []
        }

    total_searches = len(df)
    successful_searches = int(df["result_found"].sum())
    failure_rate = round((1 - successful_searches / total_searches) * 100, 2) if total_searches else 0
    top_services = (
        df.groupby("layanan")["id"]
        .count()
        .sort_values(ascending=False)
        .head(5)
        .to_dict()
    )

    return {
        "total_searches": total_searches,
        "successful_searches": successful_searches,
        "failure_rate": failure_rate,
        "top_services": top_services,
    }

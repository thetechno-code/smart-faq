import csv
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database.database import init_db
from backend.schemas.faq import FAQCreate
from backend.services.faq_service import create_faq


def seed_sample_data():
    csv_path = Path(__file__).resolve().parent.parent / "data" / "sample_faq.csv"
    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            payload = FAQCreate(
                layanan=row["layanan"],
                kode_error=row["kode_error"],
                deskripsi_error=row["deskripsi_error"],
                penyebab=row["penyebab"],
                solusi=row["solusi"],
            )
            create_faq(payload)


if __name__ == "__main__":
    init_db()
    seed_sample_data()
    print("Database initialized and sample data loaded.")

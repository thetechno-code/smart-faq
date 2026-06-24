from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.ocr_service import process_image_upload

router = APIRouter()

@router.post("/")
def upload_image(file: UploadFile = File(...)):
    if file.content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only PNG/JPG/JPEG images are allowed")
    return process_image_upload(file)

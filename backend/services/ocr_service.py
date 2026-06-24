import re
import numpy as np
import cv2
from fastapi import UploadFile


def get_reader():
    import easyocr
    return easyocr.Reader(['en', 'id'])


def preprocess_image(image_bytes: bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return thresh


def extract_text_from_image(image_bytes: bytes):
    processed = preprocess_image(image_bytes)
    reader = get_reader()
    result = reader.readtext(processed, detail=0)
    return "\n".join(result)


def parse_ocr_text(text: str):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    service = ""
    code = ""
    description = ""

    for line in lines:
        if re.search(r'(service|layanan|app|system)', line, re.I):
            service = line
        if re.search(r'ERR[-_ ]?[A-Z0-9]+|E\d{3,}', line):
            code = re.search(r'ERR[-_ ]?[A-Z0-9]+|E\d{3,}', line).group(0)
        if len(description) == 0 and len(line.split()) >= 4:
            description = line

    return {
        "layanan": service or "Unknown Service",
        "kode_error": code or "Unknown Code",
        "deskripsi_error": description or text[:200],
        "raw_text": text,
    }


def process_image_upload(file: UploadFile):
    contents = file.file.read()
    text = extract_text_from_image(contents)
    parsed = parse_ocr_text(text)
    return {
        "filename": file.filename,
        "ocr_text": text,
        "parsed": parsed,
    }

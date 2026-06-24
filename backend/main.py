from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import faq, analytics, auth, history, upload
from backend.database.database import init_db

app = FastAPI(title="Smart FAQ Error Assistant API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(faq.router, prefix="/api/faq", tags=["faq"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def root():
    return {"message": "Smart FAQ Error Assistant API is running"}

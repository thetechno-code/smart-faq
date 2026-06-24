# Deployment Guide

## Local Deployment
1. Install dependencies: `pip install -r requirements.txt`
2. Initialize the database: `python scripts/init_db.py`
3. Start backend: `uvicorn backend.main:app --reload`
4. Start frontend: `streamlit run frontend/app.py`

## Environment Notes
- Ensure Python 3.10+ is installed
- Use a local folder for the SQLite database
- Set `PYTHONPATH` if needed

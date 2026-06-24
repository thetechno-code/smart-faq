# Technical Design Document

## 1. Architecture Overview
The system is composed of a Streamlit frontend, a FastAPI backend, and a SQLite database. OCR uses EasyOCR, semantic search uses Sentence Transformers + FAISS, and analytics uses Pandas/Plotly.

## 2. Component Design
- Frontend: upload page, FAQ search page, analytics dashboard
- Backend: API layer, services, ML processing, database access
- Data Layer: SQLite tables for users, faq, search_history

## 3. Processing Flow
1. Upload screenshot
2. OCR extraction
3. Regex parsing
4. Exact search in FAQ database
5. Semantic fallback search
6. Record history
7. Display analytics

## 4. Non-Functional Considerations
- Performance target: OCR <= 5 sec, search <= 2 sec
- Security: authentication and RBAC
- Scalability: SQLite for local deployment; can be replaced by PostgreSQL later

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import faiss
from backend.database.database import get_connection

MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'


def get_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def load_faq_documents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT layanan, kode_error, deskripsi_error, penyebab, solusi FROM faq')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def build_search_index():
    docs = load_faq_documents()
    if not docs:
        return []
    corpus = [
        f"{row['layanan']} {row['kode_error']} {row['deskripsi_error']} {row['penyebab']} {row['solusi']}"
        for row in docs
    ]
    model = get_model()
    embeddings = model.encode(corpus, convert_to_numpy=True)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings.astype('float32'))
    return docs, index, embeddings


def search_semantic_index(query: str, top_k: int = 5):
    docs, index, _ = build_search_index()
    if not docs:
        return []
    model = get_model()
    query_embedding = model.encode([query], convert_to_numpy=True).astype('float32')
    distances, indices = index.search(query_embedding, min(top_k, len(docs)))
    results = []
    for idx, score in zip(indices[0], distances[0]):
        doc = docs[int(idx)]
        similarity = float(max(0, 1 - score / 10))
        results.append({
            **doc,
            'similarity_score': round(similarity, 3),
        })
    return results


def cluster_faq():
    docs = load_faq_documents()
    if not docs:
        return []
    texts = [f"{row['layanan']} {row['deskripsi_error']}" for row in docs]
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(texts)
    k = min(3, len(docs))
    km = KMeans(n_clusters=k, random_state=42)
    km.fit(X)
    return [
        {
            'id': row['id'] if 'id' in row else i,
            'layanan': row['layanan'],
            'cluster': int(label),
        }
        for i, (row, label) in enumerate(zip(docs, km.labels_))
    ]

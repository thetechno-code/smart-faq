import streamlit as st
import requests

st.set_page_config(page_title="Smart FAQ Error Assistant", layout="wide")

st.title("Smart FAQ Error Assistant")

if 'token' not in st.session_state:
    st.session_state.token = None

menu = ["Home", "Upload", "FAQ", "History", "Analytics"]
choice = st.sidebar.selectbox("Navigation", menu)

if choice == "Home":
    st.write("Welcome to Smart FAQ Error Assistant")
    st.write("Upload screenshots to detect error details and search for solutions.")

elif choice == "Upload":
    uploaded = st.file_uploader("Upload screenshot", type=["png", "jpg", "jpeg"])
    if uploaded:
        files = {"file": uploaded.getvalue()}
        st.write("Processing image...")
        response = requests.post("http://localhost:8000/api/upload/", files={"file": (uploaded.name, uploaded.getvalue(), uploaded.type)})
        st.json(response.json())

elif choice == "FAQ":
    st.subheader("Search FAQ")
    layanan = st.text_input("Layanan")
    kode_error = st.text_input("Kode Error")
    query_text = st.text_input("Query Text")
    if st.button("Search"):
        payload = {
            "layanan": layanan,
            "kode_error": kode_error,
            "query_text": query_text,
        }
        response = requests.post("http://localhost:8000/api/faq/search", json=payload)
        st.json(response.json())

elif choice == "History":
    response = requests.get("http://localhost:8000/api/history/")
    st.json(response.json())

elif choice == "Analytics":
    response = requests.get("http://localhost:8000/api/analytics/")
    st.json(response.json())

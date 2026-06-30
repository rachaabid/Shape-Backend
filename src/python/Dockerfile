FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
# Installe torch CPU uniquement (évite ~2 Go de CUDA inutile)
RUN pip install --no-cache-dir \
      torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Pré-télécharge le modèle SBERT au build (évite la latence au 1er appel)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

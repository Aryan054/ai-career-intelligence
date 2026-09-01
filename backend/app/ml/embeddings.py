from sentence_transformers import SentenceTransformer
import numpy as np

# Load the SentenceTransformer model
# This will download the model weights on the first run (approx. 90MB)
MODEL_NAME = "all-MiniLM-L6-v2"

_embedder = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(MODEL_NAME)
    return _embedder

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding vector for the given text."""
    embedder = get_embedder()
    # Sentence Transformers output numpy arrays; convert to float list for pgvector
    vector = embedder.encode(text)
    return vector.tolist()
